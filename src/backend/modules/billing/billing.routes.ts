import { Router } from "express";
import { z } from "zod";
import { validate } from "../../middlewares/validate.ts";
import { authenticate } from "../../middlewares/authenticate.ts";
import { apiLimiter } from "../../middlewares/rateLimiters.ts";
import * as billingController from "./billing.controller.ts";

const router = Router();

const checkoutSchema = {
  body: z.object({
    planId: z.string().min(1),
    billingCycle: z.enum(["monthly", "yearly"]),
  }),
};

router.get("/plans", billingController.listPlans);
router.post("/checkout", authenticate as any, apiLimiter, validate(checkoutSchema), billingController.createCheckout);
router.post("/direct-update", authenticate as any, apiLimiter, billingController.directUpdatePlan);
router.post("/cancel", authenticate as any, apiLimiter, billingController.cancelSubscription);
router.post("/reactivate", authenticate as any, apiLimiter, billingController.reactivateSubscription);
router.post("/purchase-credits", authenticate as any, apiLimiter, billingController.purchaseCredits);

// Real stripe webhook
router.post("/webhook", billingController.handleWebhook);

// Local simulator redirect for test users
router.get("/mock-success", billingController.mockSuccessRedirect);

export default router;
