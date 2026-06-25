import { Router } from "express";
import { z } from "zod";
import { validate } from "../../middlewares/validate.ts";
import { authenticate, requireAdmin } from "../../middlewares/authenticate.ts";
import { adminLimiter } from "../../middlewares/rateLimiters.ts";
import * as settingsController from "./settings.controller.ts";

const router = Router();

const updateSettingsSchema = {
  body: z.array(
    z.object({
      key: z.string().min(1),
      value: z.string(),
    })
  ),
};

router.get(
  "/",
  authenticate as any,
  requireAdmin as any,
  adminLimiter,
  settingsController.listSettings
);

router.patch(
  "/",
  authenticate as any,
  requireAdmin as any,
  validate(updateSettingsSchema),
  settingsController.updateSettings
);

export default router;
