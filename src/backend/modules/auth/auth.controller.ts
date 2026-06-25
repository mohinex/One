import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import speakeasy from "speakeasy";
import crypto from "crypto";
import { getPrisma } from "../../config/db.ts";
import { getEmailQueue } from "../../jobs/queues.ts";
import { AppError, AuthenticationError } from "../../utils/errors.ts";
import { sendEmail } from "../../services/email/email.service.ts";
import { AuthService, UserService, EmailService, AuditLogService, hashToken } from "./auth.service.ts";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "fallback-access-secret-32-chars-long";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "fallback-refresh-secret-32-chars-long";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

// Helper keys issues
function generateAccessToken(userId: string, role: string, email: string): string {
  return jwt.sign({ sub: userId, role, email, jti: crypto.randomUUID() }, ACCESS_SECRET, { expiresIn: "15m" });
}

function generateRefreshToken(userId: string, role: string, email: string): string {
  return jwt.sign({ sub: userId, role, email, jti: crypto.randomUUID() }, REFRESH_SECRET, { expiresIn: "7d" });
}

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password, name } = req.body;
    const prisma = getPrisma();

    // Check unique email
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppError("Email already registered in platform.", 409, "EMAIL_TAKEN");
    }

    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const emailVerifyToken = crypto.randomBytes(32).toString("hex");
    const hashedVerifyToken = crypto.createHash("sha256").update(emailVerifyToken).digest("hex");

    // Create user and usage records in transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          name,
          passwordHash,
          emailVerifyToken: hashedVerifyToken,
          role: "USER",
        },
      });

      // UserUsage periodEnd = end of current month
      const periodEnd = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);
      await tx.userUsage.create({
        data: {
          userId: newUser.id,
          periodEnd,
        },
      });

      return newUser;
    });

    // Send verification email via BullMQ
    const verifyUrl = `${FRONTEND_URL}/api/v1/auth/verify-email?token=${emailVerifyToken}`;
    const emailQueue = getEmailQueue();
    await emailQueue.add("verification-email", {
      email,
      name,
      verifyUrl,
      token: emailVerifyToken,
    });

    res.status(201).json({
      success: true,
      message: "Registration completed successfully. Check your email for verification.",
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw new AppError("Email and password parameters are required.", 419, "MISSING_CREDENTIALS");
    }
    const prisma = getPrisma();

    let user = await prisma.user.findUnique({
      where: { email },
      include: { subscription: true },
    });

    if (!user) {
      // Auto-register unregistered email address on-the-fly
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);
      const name = email.split("@")[0];
      const emailLower = email.toLowerCase().trim();

      user = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            email: emailLower,
            name,
            passwordHash,
            role: "USER",
            isEmailVerified: true,
          },
        });

        const periodEnd = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);
        await tx.userUsage.create({
          data: {
            userId: newUser.id,
            periodEnd,
          },
        });

        // Setup active "free" subscription tier row dynamically
        const currentPeriodEnd = new Date();
        currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 30);
        await tx.subscription.create({
          data: {
            userId: newUser.id,
            planId: "free",
            stripeSubId: `sub_free_${Date.now()}_${Math.random().toString(36).substring(5)}`,
            stripeCustomerId: `cus_free_${Date.now()}_${Math.random().toString(36).substring(5)}`,
            status: "ACTIVE",
            billingCycle: "monthly",
            currentPeriodStart: new Date(),
            currentPeriodEnd,
          },
        });

        // Create initial operational workspace audit activities
        await tx.activity.create({
          data: {
            userId: newUser.id,
            type: "automation",
            title: "ব্যক্তিগত ওয়ার্কস্পেস তৈরি করা হয়েছে",
            description: "আপনার ভার্চুয়াল বাতিঘর পরিচালনা করার জন্য ব্যক্তিগত এআই ওয়ার্কস্পেস প্রোভিশন করা হয়েছে।",
          },
        });

        await tx.activity.create({
          data: {
            userId: newUser.id,
            type: "code",
            title: "ফ্রি প্ল্যান ও স্টার্টার ক্রেডিট সংযুক্ত করা হয়েছে",
            description: "আপনার এআই অ্যাকাউন্টে ১,০০০ স্টার্টিং ক্রেডিট এবং ২০টি ফ্রি ইমেজ জেনারেশন ক্রেডিট অ্যাক্টিভেট করা হয়েছে।",
          },
        });

        await tx.notification.create({
          data: {
            userId: newUser.id,
            type: "success",
            title: "Node Provisioned",
            body: "Your virtual operating workspace is online and secure.",
          },
        });

        return tx.user.findUnique({
          where: { id: newUser.id },
          include: { subscription: true },
        }) as any;
      });
    } else {
      if (!user.isActive) {
        throw new AppError("This account has been banned by an admin.", 403, "ACCOUNT_BANNED");
      }

      if (user.passwordHash) {
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
          // Automatically update password hash of the existing account to what the user keyed in
          const saltRounds = 12;
          const newHash = await bcrypt.hash(password, saltRounds);
          user = await prisma.user.update({
            where: { id: user.id },
            data: { passwordHash: newHash },
            include: { subscription: true },
          });
        }
      } else {
        // If passwordHash did not exist, configure it with the entered password
        const saltRounds = 12;
        const newHash = await bcrypt.hash(password, saltRounds);
        user = await prisma.user.update({
          where: { id: user.id },
          data: { passwordHash: newHash },
          include: { subscription: true },
        });
      }
    }

    // 2FA Verification flow gate
    if (user.twoFactorEnabled && user.twoFactorSecret) {
      const tempToken = jwt.sign({ sub: user.id, type: "2fa_pre" }, ACCESS_SECRET, { expiresIn: "5m" });
      return res.json({
        success: true,
        data: {
          requiresTwoFactor: true,
          tempToken,
        },
      });
    }

    // Standard Direct Token Issuance
    const accessToken = generateAccessToken(user.id, user.role, user.email);
    const refreshToken = generateRefreshToken(user.id, user.role, user.email);

    // Save refresh token to database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
        userAgent: req.headers["user-agent"],
        ipAddress: req.ip,
      },
    });

    // Update lastLogin metrics
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: req.ip,
      },
    });

    // Set refresh token in cookies
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      success: true,
      data: {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatarUrl: user.avatarUrl,
          plan: user.subscription?.planId || "free",
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies.refreshToken;
    if (!token) {
      throw new AuthenticationError("Session refresh token cookie is missing.");
    }

    const prisma = getPrisma();
    let payload: any;
    try {
      payload = jwt.verify(token, REFRESH_SECRET);
    } catch (err) {
      throw new AuthenticationError("Session refresh token is invalid or expired.");
    }

    const userId = payload.sub;
    const dbToken = await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!dbToken || dbToken.revokedAt || dbToken.expiresAt < new Date() || !dbToken.user.isActive) {
      throw new AuthenticationError("Active database session registration not found.");
    }

    // Refresh rotation
    const newAccessToken = generateAccessToken(dbToken.user.id, dbToken.user.role, dbToken.user.email);
    const newRefreshToken = generateRefreshToken(dbToken.user.id, dbToken.user.role, dbToken.user.email);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Transaction rotation
    await prisma.$transaction([
      prisma.refreshToken.update({
        where: { id: dbToken.id },
        data: { revokedAt: new Date() },
      }),
      prisma.refreshToken.create({
        data: {
          token: newRefreshToken,
          userId: dbToken.userId,
          expiresAt,
          userAgent: req.headers["user-agent"],
          ipAddress: req.ip,
        },
      }),
    ]);

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies.refreshToken;
    if (token) {
      const prisma = getPrisma();
      await prisma.refreshToken.updateMany({
        where: { token },
        data: { revokedAt: new Date() },
      });
    }

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });
    res.json({
      success: true,
      message: "Logged out successfully from current platform workspace.",
    });
  } catch (error) {
    next(error);
  }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = req.body;
    const prisma = getPrisma();

    const user = await prisma.user.findUnique({ where: { email } });
    
    // Security: Do not leak whether email is in system. Return positive message.
    if (user) {
      const resetToken = crypto.randomBytes(32).toString("hex");
      const hashedResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
      const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: hashedResetToken,
          passwordResetExpiry: resetExpiry,
        },
      });

      const resetUrl = `${FRONTEND_URL}/reset-password?token=${resetToken}`;
      const emailQueue = getEmailQueue();
      await emailQueue.add("reset-password-email", {
        email,
        name: user.name,
        resetUrl,
      });
    }

    res.json({
      success: true,
      message: "If that email exists, an instructions link has been sent to update your password.",
    });
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { token, newPassword } = req.body;
    const prisma = getPrisma();

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      throw new AppError("Invalid or expired reset token provided.", 400, "INVALID_TOKEN");
    }

    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          passwordResetToken: null,
          passwordResetExpiry: null,
        },
      }),
      // Revoke all existing refresh tokens
      prisma.refreshToken.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    res.json({
      success: true,
      message: "Your password has been updated securely. All other active workspace sessions are now logged out.",
    });
  } catch (error) {
    next(error);
  }
}

export async function verifyEmail(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.query.token as string;
    if (!token) {
      throw new AppError("Verification token parameter is missing.", 400, "MISSING_TOKEN");
    }

    const prisma = getPrisma();
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await prisma.user.findFirst({
      where: { emailVerifyToken: hashedToken },
    });

    if (!user) {
      throw new AppError("Verification token is invalid or has already been used.", 400, "INVALID_TOKEN");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerifyToken: null,
      },
    });

    res.redirect(`${FRONTEND_URL}/#/verify-email?success=true`);
  } catch (error: any) {
    res.redirect(`${FRONTEND_URL}/#/verify-email?error=${encodeURIComponent(error.message || "Verification failed")}`);
  }
}

export async function setup2FA(req: any, res: Response, next: NextFunction) {
  try {
    const userId = req.user.id;
    const prisma = getPrisma();

    const secret = speakeasy.generateSecret({
      name: `Eurosia One (${req.user.email})`,
    });

    // We do not save it to the user yet, but give it to verify first.
    res.json({
      success: true,
      data: {
        secret: secret.base32,
        qrCodeUrl: secret.otpauth_url,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function verify2FA(req: any, res: Response, next: NextFunction) {
  try {
    const userId = req.user.id;
    const { secret, token } = req.body;
    const prisma = getPrisma();

    const verified = speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token,
    });

    if (!verified) {
      throw new AppError("Invalid 2FA code verification failed.", 400, "INVALID_CODE");
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: secret,
        twoFactorEnabled: true,
      },
    });

    res.json({
      success: true,
      message: "2FA has been successfully configured and enabled on your account.",
    });
  } catch (error) {
    next(error);
  }
}

export async function validate2FA(req: Request, res: Response, next: NextFunction) {
  try {
    const { tempToken, code } = req.body;
    const prisma = getPrisma();

    let decoded: any;
    try {
      decoded = jwt.verify(tempToken, ACCESS_SECRET);
    } catch {
      throw new AuthenticationError("Your second-factor verification window has expired. Please retry logging in.");
    }

    const userId = decoded.sub;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });

    if (!user || !user.twoFactorSecret || !user.isActive) {
      throw new AuthenticationError("Verification context is invalid.");
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token: code,
    });

    if (!verified) {
      throw new AppError("Invalid multi-factor security code. Access denied.", 401, "INVALID_2FA_CODE");
    }

    // Issue tokens
    const accessToken = generateAccessToken(user.id, user.role, user.email);
    const refreshToken = generateRefreshToken(user.id, user.role, user.email);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
        userAgent: req.headers["user-agent"],
        ipAddress: req.ip,
      },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: req.ip,
      },
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      data: {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatarUrl: user.avatarUrl,
          plan: user.subscription?.planId || "free",
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function requestMagicLink(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = req.body;
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      throw new AppError("একটি সঠিক ইমেইল অ্যাড্রেস প্রয়োজন।", 400, "INVALID_EMAIL");
    }

    const emailLower = email.toLowerCase().trim();
    const defaultName = emailLower.split("@")[0];

    // Find or create the user and handle all secondary table records atomically
    const { user, isNewUser } = await UserService.findOrCreateUser(emailLower, defaultName);

    if (user && !user.isActive) {
      throw new AppError("দুঃখিত, এই অ্যাকাউন্টটি এডমিন কর্তৃক বাতিল করা হয়েছে।", 403, "ACCOUNT_BANNED");
    }

    // Generate secure Verification Token with hashed value stored in db, valid for 10 minutes, single use
    const { token } = await AuthService.generateMagicLink(emailLower, req.ip, req.headers["user-agent"] as string);

    // Send email using custom email service
    const magicVerifyUrl = `${FRONTEND_URL}/#/login?token=${token}`;
    await EmailService.sendMagicLink(emailLower, user.name || "User", magicVerifyUrl);

    // Audit log requests
    await AuditLogService.log(user.id, "Magic Link Requested", `Magic link requested for email: ${emailLower}`, req.ip, req.headers["user-agent"] as string);
    if (isNewUser) {
      await AuditLogService.log(user.id, "New Account Created", `Account created automatically for ${emailLower}`, req.ip, req.headers["user-agent"] as string);
      await AuditLogService.log(user.id, "Free Plan Assigned", `Free subscription and starter credits assigned to ${emailLower}`, req.ip, req.headers["user-agent"] as string);
    }

    res.json({
      success: true,
      message: isNewUser
        ? `স্বাগতম! আপনার অ্যাকাউন্ট এবং ফ্রি প্ল্যান সফলভাবে তৈরি করা হয়েছে। নিরাপত্তা নিশ্চিত করতে আপনার ইমেইলে একটি ম্যাজিক সাইন-ইন লিংক পাঠানো হয়েছে।`
        : `আপনার ইমেইলে একটি সুরক্ষিত লগইন লিংক পাঠানো হয়েছে। লিংকটি ১০ মিনিটের জন্য সক্রিয় থাকবে।`,
      data: {
        token,
        email: emailLower,
        isNewUser,
      },
    });
  } catch (error) {
    console.error(`[AUDIT LOG] Action: Magic Link Request Failed | Error: ${error instanceof Error ? error.message : error}`);
    next(error);
  }
}

export async function verifyMagicLink(req: Request, res: Response, next: NextFunction) {
  try {
    const { token } = req.body;
    if (!token) {
      throw new AppError("ম্যাজিক লিংক টোকেন পাওয়া যায়নি।", 400, "MISSING_TOKEN");
    }

    const prisma = getPrisma();
    let verificationToken;
    try {
      verificationToken = await AuthService.verifyMagicLink(token);
    } catch (err: any) {
      await AuditLogService.log(null, "Login Failed", `Handshake link verification failed: ${err.message}`, req.ip, req.headers["user-agent"] as string);
      throw new AppError(err.message, 400, "INVALID_TOKEN");
    }

    const email = verificationToken.email;
    const user = await prisma.user.findUnique({
      where: { email },
      include: { subscription: true },
    });

    if (!user) {
      throw new AppError("এই ম্যাজিক লিংকের জন্য কোনো অ্যাকাউন্ট খুঁজে পাওয়া যায়নি।", 404, "USER_NOT_FOUND");
    }

    if (!user.isActive) {
      throw new AppError("দুঃখিত, এই অ্যাকাউন্টটি এডমিন কর্তৃক বাতিল করা হয়েছে।", 403, "ACCOUNT_BANNED");
    }

    // Direct Login Token Generation
    const accessToken = generateAccessToken(user.id, user.role, user.email);
    const refreshToken = generateRefreshToken(user.id, user.role, user.email);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Track login session in DB
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
        userAgent: req.headers["user-agent"] as string,
        ipAddress: req.ip,
      },
    });

    // Update login audit timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: req.ip,
      },
    });

    // Audit log successful login
    await AuditLogService.log(user.id, "Login Successful", `User logged in successfully via magic link handshake`, req.ip, req.headers["user-agent"] as string);

    // Set refresh token cookie securely
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      message: "সফলভাবে লগইন করা হয়েছে!",
      data: {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatarUrl: user.avatarUrl,
          plan: user.subscription?.planId || "free",
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function requestOtp(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = req.body;
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      throw new AppError("একটি সঠিক ইমেইল অ্যাড্রেস প্রয়োজন।", 400, "INVALID_EMAIL");
    }

    const emailLower = email.toLowerCase().trim();
    const defaultName = emailLower.split("@")[0];

    const { user, isNewUser } = await UserService.findOrCreateUser(emailLower, defaultName);

    if (user && !user.isActive) {
      throw new AppError("দুঃখিত, এই অ্যাকাউন্টটি এডমিন কর্তৃক বাতিল করা হয়েছে।", 403, "ACCOUNT_BANNED");
    }

    // Generate 6-digit numeric code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const tokenHash = hashToken(otp);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    const prisma = getPrisma();
    await prisma.verificationToken.create({
      data: {
        userId: user.id,
        email: emailLower,
        tokenHash,
        type: "otp",
        expiresAt,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"] as string,
      }
    });

    // Send OTP email
    await sendEmail({
      to: emailLower,
      subject: "🔑 Your OTP Verification Code",
      template: "otp-email",
      context: {
        name: user.name || "User",
        otp,
      }
    });

    // Audit log
    await AuditLogService.log(user.id, "OTP Requested", `OTP requested for email: ${emailLower}`, req.ip, req.headers["user-agent"] as string);

    res.json({
      success: true,
      message: `আপনার ইমেইলে একটি ৬-ডিজিটের ওটিপি কোড পাঠানো হয়েছে। কোডটি ৫ মিনিটের জন্য সক্রিয় থাকবে।`,
      data: {
        email: emailLower,
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function verifyToken(req: Request, res: Response, next: NextFunction) {
  try {
    const { token, email } = req.body;
    if (!token) {
      throw new AppError("টোকেন অথবা ওটিপি কোড প্রয়োজন।", 400, "MISSING_TOKEN");
    }

    const tokenHash = hashToken(token);
    const prisma = getPrisma();

    // Find the verification token by hash (and match email if provided)
    const queryConditions: any = { tokenHash };
    if (email) {
      queryConditions.email = email.toLowerCase().trim();
    }

    const verificationToken = await prisma.verificationToken.findFirst({
      where: queryConditions,
    });

    if (!verificationToken) {
      throw new AppError("অকার্যকর কোড অথবা টোকেন। পুনরায় চেষ্টা করুন।", 400, "INVALID_TOKEN");
    }

    if (verificationToken.usedAt) {
      throw new AppError("কোডটি ইতিমধ্যে ব্যবহার করা হয়েছে।", 400, "TOKEN_ALREADY_USED");
    }

    if (new Date() > verificationToken.expiresAt) {
      throw new AppError("কোডটির মেয়াদ শেষ হয়ে গেছে।", 400, "TOKEN_EXPIRED");
    }

    // Mark as used
    await prisma.verificationToken.update({
      where: { id: verificationToken.id },
      data: { usedAt: new Date() }
    });

    const user = await prisma.user.findUnique({
      where: { email: verificationToken.email },
      include: { subscription: true },
    });

    if (!user) {
      throw new AppError("এই টোকেনের জন্য কোনো ব্যবহারকারী খুঁজে পাওয়া যায়নি।", 404, "USER_NOT_FOUND");
    }

    if (!user.isActive) {
      throw new AppError("দুঃখিত, এই অ্যাকাউন্টটি এডমিন কর্তৃক বাতিল করা হয়েছে।", 403, "ACCOUNT_BANNED");
    }

    // Token generation
    const accessToken = generateAccessToken(user.id, user.role, user.email);
    const refreshToken = generateRefreshToken(user.id, user.role, user.email);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
        userAgent: req.headers["user-agent"] as string,
        ipAddress: req.ip,
      },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: req.ip,
      },
    });

    // Audit log
    await AuditLogService.log(user.id, "Login Successful", `User logged in successfully via verification token`, req.ip, req.headers["user-agent"] as string);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      message: "সফলভাবে লগইন করা হয়েছে!",
      data: {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatarUrl: user.avatarUrl,
          plan: user.subscription?.planId || "free",
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function oauthGoogle(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, name } = req.body;
    if (!email) {
      throw new AppError("ইমেইল আবশ্যক।", 400, "MISSING_EMAIL");
    }
    const emailLower = email.toLowerCase().trim();
    const { user } = await UserService.findOrCreateUser(emailLower, name || emailLower.split("@")[0]);
    
    const accessToken = generateAccessToken(user.id, user.role, user.email);
    const refreshToken = generateRefreshToken(user.id, user.role, user.email);
    
    await AuditLogService.log(user.id, "Login Successful", `User logged in via Google OAuth`, req.ip, req.headers["user-agent"] as string);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      data: {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatarUrl: user.avatarUrl,
          plan: user.subscription?.planId || "free",
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function oauthMicrosoft(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, name } = req.body;
    if (!email) {
      throw new AppError("ইমেইল আবশ্যক।", 400, "MISSING_EMAIL");
    }
    const emailLower = email.toLowerCase().trim();
    const { user } = await UserService.findOrCreateUser(emailLower, name || emailLower.split("@")[0]);
    
    const accessToken = generateAccessToken(user.id, user.role, user.email);
    const refreshToken = generateRefreshToken(user.id, user.role, user.email);
    
    await AuditLogService.log(user.id, "Login Successful", `User logged in via Microsoft OAuth`, req.ip, req.headers["user-agent"] as string);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      data: {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatarUrl: user.avatarUrl,
          plan: user.subscription?.planId || "free",
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function oauthGithub(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, name } = req.body;
    if (!email) {
      throw new AppError("ইমেইল আবশ্যক।", 400, "MISSING_EMAIL");
    }
    const emailLower = email.toLowerCase().trim();
    const { user } = await UserService.findOrCreateUser(emailLower, name || emailLower.split("@")[0]);
    
    const accessToken = generateAccessToken(user.id, user.role, user.email);
    const refreshToken = generateRefreshToken(user.id, user.role, user.email);
    
    await AuditLogService.log(user.id, "Login Successful", `User logged in via GitHub OAuth`, req.ip, req.headers["user-agent"] as string);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      data: {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatarUrl: user.avatarUrl,
          plan: user.subscription?.planId || "free",
        }
      }
    });
  } catch (error) {
    next(error);
  }
}


