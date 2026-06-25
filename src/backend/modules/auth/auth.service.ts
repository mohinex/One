import { getPrisma } from "../../config/db.ts";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { sendEmail } from "../../services/email/email.service.ts";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "fallback-access-secret-32-chars-long";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "fallback-refresh-secret-32-chars-long";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export class AuthService {
  static async generateMagicLink(email: string, ipAddress?: string, userAgent?: string): Promise<{ token: string, tokenHash: string }> {
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashToken(token);
    
    // Find if user exists or not (used to link userId if exists)
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({ where: { email } });
    
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.verificationToken.create({
      data: {
        userId: user?.id || null,
        email,
        tokenHash,
        type: "magic-link",
        expiresAt,
        ipAddress,
        userAgent,
      }
    });

    return { token, tokenHash };
  }

  static async verifyMagicLink(token: string): Promise<any> {
    const prisma = getPrisma();
    const tokenHash = hashToken(token);

    const verificationToken = await prisma.verificationToken.findUnique({
      where: { tokenHash }
    });

    if (!verificationToken) {
      throw new Error("অকার্যকর ম্যাজিক লিংক টোকেন। পুনরায় চেষ্টা করুন।");
    }

    if (verificationToken.usedAt) {
      throw new Error("ম্যাজিক লিংকটি ইতিমধ্যে ব্যবহার করা হয়েছে।");
    }

    if (new Date() > verificationToken.expiresAt) {
      throw new Error("ম্যাজিক লিংক টোকেনটির মেয়াদ শেষ হয়ে গেছে।");
    }

    // Mark as used
    await prisma.verificationToken.update({
      where: { id: verificationToken.id },
      data: { usedAt: new Date() }
    });

    return verificationToken;
  }
}

export class UserService {
  static async findOrCreateUser(email: string, defaultName: string): Promise<{ user: any, isNewUser: boolean }> {
    const prisma = getPrisma();
    
    let user = await prisma.user.findUnique({
      where: { email },
      include: { subscription: true }
    });

    if (user) {
      return { user, isNewUser: false };
    }

    // Wrap the creation inside a transaction for atomic guarantees
    user = await prisma.$transaction(async (tx: any) => {
      const newUser = await tx.user.create({
        data: {
          email,
          name: defaultName,
          isEmailVerified: true,
          role: "USER"
        }
      });

      // User Profile Assignment
      await tx.userProfile.create({
        data: {
          userId: newUser.id,
          bio: "Personal Space Owner"
        }
      });

      // Workspace Assignment
      await tx.workspace.create({
        data: {
          userId: newUser.id,
          name: "Personal Workspace",
          type: "personal"
        }
      });

      // Starter Credits Wallet Assignment
      await tx.creditWallet.create({
        data: {
          userId: newUser.id,
          balance: 1000 // Starter Credits
        }
      });

      // Usage Limits Assignment
      await tx.usageLimit.create({
        data: {
          userId: newUser.id,
          monthlyLimit: 100
        }
      });

      // Standard userUsage (limits tracker)
      const periodEnd = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);
      await tx.userUsage.create({
        data: {
          userId: newUser.id,
          periodEnd
        }
      });

      // Free Plan Subscription Assignment
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
          currentPeriodEnd
        }
      });

      // Audit Log and Activities for new user
      await tx.activity.create({
        data: {
          userId: newUser.id,
          type: "automation",
          title: "ব্যক্তিগত ওয়ার্কস্পেস তৈরি করা হয়েছে",
          description: "আপনার ভার্চুয়াল বাতিঘর পরিচালনা করার জন্য ব্যক্তিগত এআই ওয়ার্কস্পেস প্রোভিশন করা হয়েছে।"
        }
      });

      await tx.activity.create({
        data: {
          userId: newUser.id,
          type: "code",
          title: "ফ্রি প্ল্যান ও স্টার্টার ক্রেডিট সংযুক্ত করা হয়েছে",
          description: "আপনার এআই অ্যাকাউন্টে ১,০০০ স্টার্টিং ক্রেডিট এবং ২০টি ফ্রি ইমেজ জেনারেশন ক্রেডিট অ্যাক্টিভেট করা হয়েছে।"
        }
      });

      await tx.notification.create({
        data: {
          userId: newUser.id,
          type: "success",
          title: "Node Provisioned",
          body: "Your virtual operating workspace is online and secure."
        }
      });

      return newUser;
    });

    // Re-fetch with subscription
    const finalUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { subscription: true }
    });

    return { user: finalUser, isNewUser: true };
  }
}

export class SubscriptionService {
  static async assignFreeSubscription(userId: string): Promise<any> {
    const prisma = getPrisma();
    const currentPeriodEnd = new Date();
    currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 30);

    return await prisma.subscription.upsert({
      where: { userId },
      update: {
        planId: "free",
        status: "ACTIVE",
        currentPeriodEnd,
      },
      create: {
        userId,
        planId: "free",
        stripeSubId: `sub_free_${Date.now()}_${Math.random().toString(36).substring(5)}`,
        stripeCustomerId: `cus_free_${Date.now()}_${Math.random().toString(36).substring(5)}`,
        status: "ACTIVE",
        billingCycle: "monthly",
        currentPeriodStart: new Date(),
        currentPeriodEnd,
      }
    });
  }
}

export class WorkspaceService {
  static async createWorkspace(userId: string, name: string = "Personal Workspace"): Promise<any> {
    const prisma = getPrisma();
    return await prisma.workspace.create({
      data: {
        userId,
        name,
        type: "personal"
      }
    });
  }
}

export class CreditService {
  static async assignStarterCredits(userId: string): Promise<any> {
    const prisma = getPrisma();
    return await prisma.creditWallet.upsert({
      where: { userId },
      update: {
        balance: 1000
      },
      create: {
        userId,
        balance: 1000
      }
    });
  }
}

export class EmailService {
  static async sendMagicLink(email: string, name: string, magicVerifyUrl: string): Promise<any> {
    return await sendEmail({
      to: email,
      subject: "🔑 Your Magic Login Handshake Link",
      template: "magic-link-email",
      context: {
        name,
        magicVerifyUrl,
      }
    });
  }
}

export class AuditLogService {
  static async log(userId: string | null, action: string, description: string, ipAddress?: string, userAgent?: string): Promise<any> {
    const prisma = getPrisma();
    console.log(`[AUDIT LOG] Action: ${action} | User: ${userId} | Desc: ${description} | IP: ${ipAddress}`);
    
    if (userId) {
      return await prisma.activity.create({
        data: {
          userId,
          type: "automation",
          title: action,
          description,
          metadata: JSON.stringify({ ipAddress, userAgent })
        }
      });
    }
  }
}
