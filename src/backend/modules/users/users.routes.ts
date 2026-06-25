import { Router } from "express";
import { z } from "zod";
import { validate } from "../../middlewares/validate.ts";
import { authenticate } from "../../middlewares/authenticate.ts";
import { apiLimiter } from "../../middlewares/rateLimiters.ts";
import * as usersController from "./users.controller.ts";

const router = Router();

const updateProfileSchema = {
  body: z.object({
    name: z.string().min(2).max(50).optional(),
    avatarUrl: z.string().url().optional(),
  }),
};

const updatePasswordSchema = {
  body: z.object({
    currentPassword: z.string().min(1),
    newPassword: z
      .string()
      .min(8)
      .regex(/(?=.*[0-9])/)
      .regex(/(?=.*[!@#$%^&*])/),
  }),
};

// Mapped pathways
router.get("/profile", authenticate as any, apiLimiter, usersController.getProfile);
router.patch("/profile", authenticate as any, validate(updateProfileSchema), usersController.updateProfile);
router.patch("/password", authenticate as any, validate(updatePasswordSchema), usersController.updatePassword);
router.get("/usage", authenticate as any, usersController.getUsage);
router.post("/push-token", authenticate as any, usersController.registerPushToken);

export default router;
