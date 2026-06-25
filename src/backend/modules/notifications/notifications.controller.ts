import { Response, NextFunction } from "express";
import { getPrisma } from "../../config/db.ts";
import { AppError } from "../../utils/errors.ts";

export async function listNotifications(req: any, res: Response, next: NextFunction) {
  try {
    const userId = req.user.id;
    const prisma = getPrisma();

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    res.json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
}

export async function markAsRead(req: any, res: Response, next: NextFunction) {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;
    const prisma = getPrisma();

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new AppError("Specified notification not found.", 404, "NOTIFICATION_NOT_FOUND");
    }

    if (notification.userId !== userId) {
      throw new AppError("Permissions denied: NOT resource owner.", 403, "FORBIDDEN");
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

export async function markAllRead(req: any, res: Response, next: NextFunction) {
  try {
    const userId = req.user.id;
    const prisma = getPrisma();

    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    res.json({
      success: true,
      message: "All non-archived user notifications marked as read.",
    });
  } catch (error) {
    next(error);
  }
}
