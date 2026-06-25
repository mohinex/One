import request from "supertest";
import express from "express";
import cookieParser from "cookie-parser";
import { register, login, refresh, logout } from "../src/backend/modules/auth/auth.controller.ts";
import { createChat, listChats } from "../src/backend/modules/chats/chats.controller.ts";
import { createCheckout, listPlans } from "../src/backend/modules/billing/billing.controller.ts";
import { errorHandler } from "../src/backend/middlewares/errorHandler.ts";

// Build clean ephemeral testing router
const app = express();
app.use(express.json());
app.use(cookieParser());

// Ephemeral sub-routers matching backend controllers for unit validations
app.post("/api/auth/register", register);
app.post("/api/auth/login", login);
app.post("/api/auth/refresh", refresh);
app.post("/api/auth/logout", logout);

app.post("/api/chats", (req: any, res, next) => {
  req.user = { id: "test_user_id" }; 
  createChat(req, res, next);
});

app.get("/api/chats", (req: any, res, next) => {
  req.user = { id: "test_user_id" };
  listChats(req, res, next);
});

app.post("/api/billing/checkout", (req: any, res, next) => {
  req.user = { id: "test_user_id" };
  createCheckout(req, res, next);
});

app.get("/api/billing/plans", listPlans);

app.use(errorHandler);

// Mocking getPrisma to prevent hanging
jest.mock("../src/backend/config/db.ts", () => ({
  getPrisma: () => ({
    user: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({
        id: "mock_user_123",
        email: "test@eurosia.one",
        name: "Test User",
        role: "USER",
      }),
    },
    userUsage: {
      findUnique: jest.fn().mockResolvedValue({
        chatCount: 0,
        imageCount: 0,
      }),
      create: jest.fn().mockResolvedValue({}),
    },
    refreshToken: {
      create: jest.fn().mockResolvedValue({}),
      findUnique: jest.fn().mockResolvedValue(null),
    },
    plan: {
      findMany: jest.fn().mockResolvedValue([
        { id: "free", name: "Free Tier", price: 0, isActive: true },
        { id: "pro", name: "Pro Tier", price: 2900, isActive: true },
      ]),
      findUnique: jest.fn().mockResolvedValue({ id: "pro", name: "Pro Tier", price: 2900, isActive: true }),
      upsert: jest.fn().mockResolvedValue({}),
    },
    subscription: {
      findUnique: jest.fn().mockResolvedValue(null),
    },
    chat: {
      create: jest.fn().mockResolvedValue({ id: "chat_abc", title: "New Chat", modelId: "gpt-4o" }),
      findMany: jest.fn().mockResolvedValue([
        { id: "chat_abc", title: "New Chat", modelId: "gpt-4o", _count: { messages: 0 } }
      ]),
      count: jest.fn().mockResolvedValue(1),
    },
    activity: {
      create: jest.fn().mockResolvedValue({}),
    },
    $transaction: jest.fn((cb) => cb({
      user: {
        create: jest.fn().mockResolvedValue({
          id: "mock_user_123",
          email: "test@eurosia.one",
          name: "Test User",
          role: "USER",
        }),
      },
      userUsage: {
        create: jest.fn().mockResolvedValue({}),
      },
      activity: {
        create: jest.fn().mockResolvedValue({}),
      },
      chat: {
        create: jest.fn().mockResolvedValue({ id: "chat_abc", title: "New Chat", modelId: "gpt-4o" }),
      },
    })),
  }),
}));

describe("Eurosia One Platform Unit Tests", () => {
  describe("Authentication Controller", () => {
    it("should process register details securely", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          email: "test@eurosia.one",
          password: "SecurePassword!99",
          name: "Test User",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe("test@eurosia.one");
    });

    it("should block empty login params with 419 error", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "", password: "" });

      expect(res.status).toBe(419);
      expect(res.body.success).toBe(false);
    });
  });

  describe("Conversations Controller", () => {
    it("should let authorized user build conversation chat panel", async () => {
      const res = await request(app)
        .post("/api/chats")
        .send({ title: "Custom Design Q&A", modelId: "claude-3-5-sonnet" });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe("chat_abc");
    });

    it("should retrieve list of current chats", async () => {
      const res = await request(app).get("/api/chats");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.chats)).toBe(true);
    });
  });

  describe("Billing Controller", () => {
    it("should stream active payment tiers list", async () => {
      const res = await request(app).get("/api/billing/plans");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it("should create redirect sessions for stripe payments", async () => {
      const res = await request(app)
        .post("/api/billing/checkout")
        .send({ planId: "pro", billingCycle: "monthly" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.sessionUrl).toContain("mock-success");
    });
  });
});
