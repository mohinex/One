import dotenv from "dotenv";
// Load environment variables immediately before any other local module imports
dotenv.config();

// Globally monkeypatch BigInt to prevent "Do not know how to serialize a BigInt" error during JSON serialization
(BigInt.prototype as any).toJSON = function () {
  const num = Number(this);
  return Number.isSafeInteger(num) ? num : this.toString();
};

import express from "express";
import http from "http";
import path from "path";
import dns from "dns";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";

// Configuration & Middlewares imports
import { initSocket } from "./src/backend/config/socket.ts";
import { initQueues } from "./src/backend/jobs/queues.ts";
import { errorHandler } from "./src/backend/middlewares/errorHandler.ts";
import logger, { stream } from "./src/backend/utils/logger.ts";
import { swaggerUi, swaggerDocument } from "./src/backend/config/swagger.ts";

// API Route modules imports
import authRouter from "./src/backend/modules/auth/auth.routes.ts";
import userRouter from "./src/backend/modules/users/users.routes.ts";
import chatsRouter from "./src/backend/modules/chats/chats.routes.ts";
import mediaRouter from "./src/backend/modules/media/media.routes.ts";
import settingsRouter from "./src/backend/modules/settings/settings.routes.ts";
import notificationsRouter from "./src/backend/modules/notifications/notifications.routes.ts";
import billingRouter from "./src/backend/modules/billing/billing.routes.ts";
import adminRouter from "./src/backend/modules/admin/admin.routes.ts";
import charactersRouter from "./src/backend/modules/characters/characters.routes.ts";

// Ensure DNS resolution works correctly in IPv6-enabled sandboxes
dns.setDefaultResultOrder("ipv4first");

const app = express();
const PORT = 3000;

// Set trust proxy to enable accurate IP tracking in express-rate-limit behind platform reverse-proxy
app.set("trust proxy", 1);

// 1. Stripe Raw Webhook Body configuration MUST precede body-parser middlewares!
app.post(
  "/api/v1/billing/webhook",
  express.raw({ type: "application/json" })
);

// 2. Global Parsing and Security Middlewares
app.use(helmet({
  contentSecurityPolicy: false, // required to allow frames/iframes and scripts loaded from cdns
}));
app.use(cors({
  origin: "*",
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());
app.use(morgan("combined", { stream }));

// Ensure public/uploads folder exists and is statically served
const localUploadsDir = path.join(process.cwd(), "public", "uploads");
if (!fs.existsSync(localUploadsDir)) {
  fs.mkdirSync(localUploadsDir, { recursive: true });
}
app.use("/uploads", express.static(localUploadsDir));

// 3. Swagger Open-API Docs Mapping
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

/**
 * PRODUCTION-READY PLATFORM GATEWAY (V1 APIS)
 */
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/chats", chatsRouter);
app.use("/api/v1/media", mediaRouter);
app.use("/api/v1/settings", settingsRouter);
app.use("/api/v1/notifications", notificationsRouter);
app.use("/api/v1/billing", billingRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/characters", charactersRouter);

/**
 * NATIVE BACKWARD COMPATIBILITY ENDPOINTS FOR FRONT-END MOCKS
 * (Ensures the user-facing workspace interface compiles and functions seamlessly instantly)
 */
let userProfileMock = {
  name: "Arif Hossain",
  email: "arif@eurosia.one",
  role: "Lead Platform Architect",
  plan: "Premium Plan",
  avatarInitials: "AH",
};

let recentChatsMock = [
  { id: "chat_1", title: "Marketing strategy discussion", timestamp: "2m ago" },
  { id: "chat_2", title: "Next.js routing patterns overview", timestamp: "15m ago" },
  { id: "chat_3", title: "PostgreSQL transaction debugging", timestamp: "1h ago" },
  { id: "chat_4", title: "UI styling tokens refinement", timestamp: "3h ago" },
  { id: "chat_5", title: "Serverless function cold-starts", timestamp: "1d ago" },
];

let activityLogsMock = [
  { id: "act_1", iconName: "Image", title: "Generated an image", description: "A futuristic cyberpunk cityscape with ambient crimson glow", timestamp: "2m ago", badgeColor: "text-emerald-600 bg-emerald-50 border-emerald-100" },
  { id: "act_2", iconName: "FileText", title: "Uploaded a PDF", description: "Company_Q3_Strategic_Growth_Proposal.pdf analyzed successfully", timestamp: "15m ago", badgeColor: "text-rose-600 bg-rose-50 border-rose-100" },
  { id: "act_3", iconName: "MessageSquare", title: "AI Chat conversation", description: "Refined SaaS product rollout timeline with Sonnet 4.6", timestamp: "1h ago", badgeColor: "text-blue-600 bg-blue-50 border-blue-100" },
  { id: "act_4", iconName: "Video", title: "Generated a video", description: "Product_Hero_Teaser_v2.mp4 (4s cinematic landscape, 1080p)", timestamp: "3h ago", badgeColor: "text-purple-600 bg-purple-50 border-purple-100" },
  { id: "act_5", iconName: "CheckCircle2", title: "Paid Subscription Activated", description: "Full access to Eurosia Pro suite renewed successfully", timestamp: "1d ago", badgeColor: "text-amber-600 bg-amber-50 border-amber-100" },
];

let systemNotificationsMock = [
  { id: "not_1", title: "Enterprise Token Limit Lifted", description: "Your server tier now supports up to 2M context tokens.", timestamp: "5m ago", unread: true, type: "success" },
  { id: "not_2", title: "New AI Model Integration", description: "Sonnet 4.6 and Gemini 3.5 are now fully integrated as default targets.", timestamp: "2h ago", unread: true, type: "info" },
  { id: "not_3", title: "Server Scaling Complete", description: "Database transaction nodes added in region asia-east1.", timestamp: "1d ago", unread: false, type: "alert" },
];

let workspaceToolsMock = [
  { id: "ai_chat", name: "AI Chat", description: "Smart high-fidelity conversations with AI models on full context", iconName: "MessageSquare", colorClass: "text-red-600 bg-red-50 border-red-100", category: "Core", path: "chat" },
  { id: "image_gen", name: "Image Generator", description: "Generate stunning high-definition visual graphics & renders", iconName: "Image", colorClass: "text-emerald-600 bg-emerald-50 border-emerald-100", category: "Creative", path: "images" },
  { id: "video_gen", name: "Video Generator", description: "Compile cinematic scenes, landscape clips, and product teasers", iconName: "Video", colorClass: "text-purple-600 bg-purple-50 border-purple-100", category: "Creative", path: "videos" },
  { id: "web_builder", name: "Website Builder", description: "Construct fully functional Tailwind static sites with real-time editing", iconName: "Globe", colorClass: "text-blue-600 bg-blue-50 border-blue-100", category: "Developer", path: "web" },
  { id: "pdf_analysis", name: "PDF Analysis", description: "Extract, read, and cross-examine pages in PDF documents with context", iconName: "FileText", colorClass: "text-rose-600 bg-rose-50 border-rose-100", category: "Documentary", path: "documents" },
  { id: "char_gen", name: "Character Generator", description: "Create customized AI personas, custom avatars, and conversational agents", iconName: "UserSquare2", colorClass: "text-amber-600 bg-amber-50 border-amber-100", category: "Interactive", path: "characters" },
  { id: "code_assist", name: "Code Assistant", description: "Generate, refine, debug, and translate syntax across engineering stacks", iconName: "Terminal", colorClass: "text-cyan-600 bg-cyan-50 border-cyan-100", category: "Developer", path: "code" },
  { id: "automation_studio", name: "Automation Studio", description: "Construct nodes, trigger listeners, and stitch workflows together", iconName: "Network", colorClass: "text-green-600 bg-green-50 border-green-100", category: "Workflow", path: "automations" },
];

let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== "MY_GEMINI_API_KEY") {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: { headers: { "User-Agent": "aistudio-build" } },
      });
    }
  }
  return aiClient;
}

app.get("/api/user/profile", (req, res) => res.json(userProfileMock));
app.get("/api/chats", (req, res) => res.json(recentChatsMock));
app.get("/api/activity", (req, res) => res.json(activityLogsMock));
app.get("/api/workspace/tools", (req, res) => res.json(workspaceToolsMock));
app.get("/api/notifications", (req, res) => res.json(systemNotificationsMock));

app.post("/api/chats/create", (req, res) => {
  const { title } = req.body;
  const newChat = {
    id: `chat_${Date.now()}`,
    title: title && title.length > 30 ? title.substring(0, 30) + "..." : (title || "Custom Conversation"),
    timestamp: "Just now",
  };
  recentChatsMock.unshift(newChat);
  res.json(newChat);
});

app.post("/api/notifications/read-all", (req, res) => {
  systemNotificationsMock = systemNotificationsMock.map((n) => ({ ...n, unread: false }));
  res.json({ success: true });
});

app.post("/api/ai/chat", async (req, res) => {
  const { prompt, contextType } = req.body;
  const targetModel = "gemini-3.5-flash";
  let systemPrompt = "You are Eurosia One, an ultra-advanced AI Operating System. Answer questions creatively, clearly, with elegant wording and impeccable formatting.";
  
  if (contextType === "code") {
    systemPrompt = "You are the Eurosia Code Assistant. Answer purely with detailed, functional code blocks, concise documentation, debugging assessments, or clean syntax templates.";
  } else if (contextType === "pdf") {
    systemPrompt = "You are Eurosia PDF Analysis Engine. Review, extract, and accurately summarize provided document snippets or mock PDF contents.";
  } else if (contextType === "character") {
    const { characterName, role, background } = req.body;
    systemPrompt = `You must roleplay entirely as the character "${characterName}". Role/Identity: ${role}. Backstory/Personality: ${background}. Always respond strictly in this tone.`;
  }

  const ai = getAI();
  if (!ai) {
    let fallbackText = `[Simulated OS Response] Eurosia One is currently running in smart-local mock mode because GEMINI_API_KEY is not set. Go to Secrets to unlock genuine AI outputs!`;
    return res.json({ text: fallbackText });
  }

  try {
    const response = await ai.models.generateContent({
      model: targetModel,
      contents: prompt,
      config: { systemInstruction: systemPrompt, temperature: 0.8 },
    });
    res.json({ text: response.text || "No response generated." });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to contact Gemini client." });
  }
});

app.post("/api/ai/web-builder", async (req, res) => {
  const { prompt } = req.body;
  const ai = getAI();

  const systemInstruction = `You are a professional HTML Website Builder. Given a descriptive prompt, write EXACTLY and ONLY valid, self-contained, beautiful single-page HTML code utilizing Tailwind CSS via CDN. Do NOT include markdown blocks. Raw HTML only.`;

  if (!ai) {
    const fallbackHTML = `<!DOCTYPE html><html><body class="bg-indigo-900 text-white p-8 text-center"><h1 class="text-3xl font-bold mb-4">Eurosia Web Sandbox</h1><p>[Offline Builder Fallback for: "${prompt}"]</p></body></html>`;
    return res.json({ html: fallbackHTML });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: { systemInstruction, temperature: 0.6 },
    });
    let rawOutput = response.text || "";
    rawOutput = rawOutput.replace(/^```html\s*/i, "").replace(/```\s*$/i, "").trim();
    res.json({ html: rawOutput });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to generate website code." });
  }
});

// 4. Fallback Global Centralized Error Handling Middlewares (V1 APIs)
app.use(errorHandler);

import { getPrisma } from "./src/backend/config/db.ts";
import { ensureDefaultPlansExist } from "./src/backend/utils/seedPlans.ts";

/**
 * STATIC ASSET SERVING & INTEGRATION SERVER BOOTSTRAPS
 */
async function startServer() {
  const server = http.createServer(app);

  // Initialize Socket.io Connection
  initSocket(server);

  // Initialize BullMQ Queue workers
  initQueues();

  // Pre-seed pricing tiers to avoid transactional foreign-key constraint violations
  try {
    const prisma = getPrisma();
    await ensureDefaultPlansExist(prisma);
    logger.info("Successfully pre-seeded tiered subscriptions plans in database.");
  } catch (err: any) {
    logger.error(`Failed to pre-seed subscription plan templates: ${err.message}`);
  }

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    logger.info(`Eurosia One Enterprise Server booted on port ${PORT} [Host: 0.0.0.0]`);
  });
}

startServer();
