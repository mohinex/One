import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.ts";
import { apiLimiter } from "../../middlewares/rateLimiters.ts";
import * as notificationsController from "./notifications.controller.ts";

const router = Router();

router.get("/", authenticate as any, apiLimiter, notificationsController.listNotifications);
router.patch("/read-all", authenticate as any, notificationsController.markAllRead);
router.patch("/:id/read", authenticate as any, notificationsController.markAsRead);

export default router;
