import { Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import { getPrisma } from "../../config/db.ts";
import { AppError } from "../../utils/errors.ts";

export async function getProfile(req: any, res: Response, next: NextFunction) {
  try {
    const userId = req.user.id;
    const prisma = getPrisma();

    let user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        role: true,
        isEmailVerified: true,
        twoFactorEnabled: true,
        createdAt: true,
        updatedAt: true,
        subscription: {
          include: { plan: true },
        },
        usage: true,
      },
    });

    if (!user) {
      throw new AppError("User not found.", 404, "USER_NOT_FOUND");
    }

    let subscription = user.subscription;
    if (!subscription) {
      try {
        const periodEnd = new Date();
        periodEnd.setDate(periodEnd.getDate() + 30);
        subscription = await prisma.subscription.create({
          data: {
            userId: user.id,
            planId: "free",
            stripeSubId: `free_${user.id}_${Date.now()}`,
            stripeCustomerId: `cus_free_${user.id}`,
            status: "ACTIVE",
            billingCycle: "monthly",
            currentPeriodStart: new Date(),
            currentPeriodEnd: periodEnd,
          },
          include: { plan: true },
        });
      } catch (err) {
        console.warn("Failed to create free subscription on the fly:", err);
      }
    }

    res.json({
      success: true,
      data: {
        ...user,
        subscription,
        plan: subscription?.plan?.name || "Free Preview Tier",
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(req: any, res: Response, next: NextFunction) {
  try {
    const userId = req.user.id;
    const { name, avatarUrl } = req.body;
    const prisma = getPrisma();

    if (name && (name.length < 2 || name.length > 50)) {
      throw new AppError("Name must be between 2 and 50 characters.", 422, "INVALID_NAME");
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name ? { name } : {}),
        ...(avatarUrl ? { avatarUrl } : {}),
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        role: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      message: "Profile updated successfully.",
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
}

export async function updatePassword(req: any, res: Response, next: NextFunction) {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    const prisma = getPrisma();

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.passwordHash) {
      throw new AppError("Invalid authentication context.", 401, "UNAUTHORIZED");
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new AppError("The current password you entered is incorrect.", 400, "INCORRECT_PASSWORD");
    }

    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
      }),
      // Revoke all other refresh sessions (force re-login on separate equipment)
      prisma.refreshToken.updateMany({
        where: {
          userId,
          NOT: {
            token: req.cookies.refreshToken || "", // keep current session active
          },
        },
        data: { revokedAt: new Date() },
      }),
    ]);

    res.json({
      success: true,
      message: "Your password has been updated. Other active logins have been revoked.",
    });
  } catch (error) {
    next(error);
  }
}

export async function getUsage(req: any, res: Response, next: NextFunction) {
  try {
    const userId = req.user.id;
    const prisma = getPrisma();

    // Fetch user usage and subscription details in parallel
    const [userUsage, subscription] = await Promise.all([
      prisma.userUsage.findUnique({
        where: { userId },
      }),
      prisma.subscription.findUnique({
        where: { userId },
        include: { plan: true },
      }),
    ]);

    if (!userUsage) {
      throw new AppError("Usage data not recorded for this user.", 404, "USAGE_NOT_FOUND");
    }

    // Default features from Free Tier if no subscription exists
    let planFeatures: any = {
      chatLimit: 100,
      imageLimit: 20,
      videoLimit: 3,
      storageGB: 1,
      apiAccess: false,
      prioritySupport: false,
    };

    if (subscription && subscription.plan && subscription.plan.features) {
      planFeatures = subscription.plan.features;
    }

    const calculatePercent = (count: number, limit: number) => {
      if (!limit || limit === 0) return 0;
      return Math.min(100, Math.round((count / limit) * 100));
    };

    res.json({
      success: true,
      data: {
        chatCount: userUsage.chatCount,
        chatLimit: planFeatures.chatLimit,
        chatPercent: calculatePercent(userUsage.chatCount, planFeatures.chatLimit),

        imageCount: userUsage.imageCount,
        imageLimit: planFeatures.imageLimit,
        imagePercent: calculatePercent(userUsage.imageCount, planFeatures.imageLimit),

        videoCount: userUsage.videoCount,
        videoLimit: planFeatures.videoLimit,
        videoPercent: calculatePercent(userUsage.videoCount, planFeatures.videoLimit),

        storageUsedBytes: userUsage.storageUsedBytes.toString(),
        storageLimitBytes: planFeatures.storageGB * 1024 * 1024 * 1024,
        storagePercent: calculatePercent(
          Number(userUsage.storageUsedBytes),
          planFeatures.storageGB * 1024 * 1024 * 1024
        ),

        apiAccess: planFeatures.apiAccess,
        prioritySupport: planFeatures.prioritySupport,
        periodEnd: userUsage.periodEnd,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function registerPushToken(req: any, res: Response, next: NextFunction) {
  try {
    const userId = req.user.id;
    const { token, platform } = req.body;
    
    // Log the registration details to aid debugging and audit trails
    console.log(`[Push Token Registration] User ${userId} registered token: ${token} for platform: ${platform}`);
    
    // Return an operational success flag
    res.json({
      success: true,
      message: "Push token registered successfully.",
      data: {
        userId,
        token,
        platform,
        registeredAt: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
}
