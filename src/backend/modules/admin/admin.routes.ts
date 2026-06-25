import { Router } from "express";
import { z } from "zod";
import { validate } from "../../middlewares/validate.ts";
import { authenticate, requireAdmin } from "../../middlewares/authenticate.ts";
import { adminLimiter } from "../../middlewares/rateLimiters.ts";
import * as adminController from "./admin.controller.ts";

const router = Router();

const statusUpdateSchema = {
  body: z.object({
    isActive: z.boolean(),
  }),
};

const toolSchema = {
  body: z.object({
    name: z.string().min(1),
    description: z.string().min(1),
    iconName: z.string().min(1),
    colorClass: z.string().min(1),
    category: z.string().min(1),
    path: z.string().min(1),
  }),
};

const bannerSchema = {
  body: z.object({
    title: z.string().min(1),
    content: z.string().min(1),
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime(),
    type: z.enum(["INFO", "WARNING", "MAINTENANCE", "PROMOTION"]),
  }),
};

const modelSchema = {
  body: z.object({
    modelId: z.string().min(1),
    name: z.string().min(1),
    provider: z.string().min(1),
    contextWindow: z.number().int().positive(),
    maxTokens: z.number().int().positive(),
  }),
};

const planSchema = {
  body: z.object({
    name: z.string().min(1),
    price: z.number().nonnegative(),
    stripeMonthlyPriceId: z.string().optional(),
    stripeYearlyPriceId: z.string().optional(),
    features: z.any(),
  }),
};

const broadcastSchema = {
  body: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    type: z.enum(["success", "info", "warning", "error"]).optional(),
  }),
};

// Route registries
router.use(authenticate as any);
router.use(requireAdmin as any);
router.use(adminLimiter);

router.get("/dashboard", adminController.getDashboardMetrics);

// Users Management
router.get("/users", adminController.listUsers);
router.patch("/users/:id/status", validate(statusUpdateSchema), adminController.updateUserStatus);
router.get("/users/export", adminController.exportUsersCSV);

// Custom integration Workspace Tools CRUD
router.get("/tools", adminController.listTools);
router.post("/tools", validate(toolSchema), adminController.createTool);
router.patch("/tools/:id", adminController.updateTool);
router.delete("/tools/:id", adminController.deleteTool);

// Campaigns Alert Banners CRUD
router.get("/banners", adminController.listBanners);
router.post("/banners", validate(bannerSchema), adminController.createBanner);
router.patch("/banners/:id", adminController.updateBanner);
router.delete("/banners/:id", adminController.deleteBanner);

// Supported AI Model targets CRUD
router.get("/models", adminController.listModels);
router.post("/models", validate(modelSchema), adminController.createModel);
router.patch("/models/:id", adminController.updateModel);
router.delete("/models/:id", adminController.deleteModel);

// Pricing level Plans CRUD
router.get("/plans", adminController.listPlans);
router.post("/plans", validate(planSchema), adminController.createPlan);
router.patch("/plans/:id", adminController.updatePlan);
router.delete("/plans/:id", adminController.deletePlan);

// Global push notifications broadcast
router.post("/broadcast", validate(broadcastSchema), adminController.sendBroadcast);

// Extended server analytical summaries
router.get("/analytics", adminController.getAnalytics);

export default router;
