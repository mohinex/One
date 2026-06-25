import { Router } from "express";
import { z } from "zod";
import { validate } from "../../middlewares/validate.ts";
import { authenticate } from "../../middlewares/authenticate.ts";
import { apiLimiter } from "../../middlewares/rateLimiters.ts";
import * as charactersController from "./characters.controller.ts";

const router = Router();

// Zod validation schemas
const createCharacterSchema = {
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters."),
    profession: z.string().min(2, "Profession is required."),
    category: z.string().default("General"),
    avatar: z.string().optional(),
    prompt: z.string().min(10, "System prompt must be at least 10 characters."),
    personality: z.string().min(5, "Personality description is required."),
    greeting: z.string().default("Greetings! How can I help you today?"),
    instructions: z.string().optional(),
    model: z.string().default("gemini"),
    temperature: z.number().min(0).max(2).default(0.7),
    tools: z.array(z.string()).optional(),
    permissions: z.any().optional(),
  }),
};

const updateCharacterSchema = {
  body: z.object({
    name: z.string().min(2).optional(),
    profession: z.string().min(2).optional(),
    category: z.string().optional(),
    avatar: z.string().optional(),
    prompt: z.string().min(10).optional(),
    personality: z.string().min(5).optional(),
    greeting: z.string().optional(),
    instructions: z.string().optional(),
    model: z.string().optional(),
    temperature: z.number().min(0).max(2).optional(),
    tools: z.array(z.string()).optional(),
    permissions: z.any().optional(),
    isArchived: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
  }),
};

const sendMessageSchema = {
  body: z.object({
    content: z.string().min(1, "Message content cannot be empty."),
  }),
};

const renameConversationSchema = {
  body: z.object({
    title: z.string().min(1, "Title cannot be empty."),
  }),
};

// --- Character CRUD Routes ---
router.get("/", authenticate as any, apiLimiter, charactersController.listCharacters);
router.post("/", authenticate as any, validate(createCharacterSchema), charactersController.createCharacter);
router.get("/categories", authenticate as any, charactersController.listCategories);
router.get("/templates", authenticate as any, charactersController.listTemplates);

router.get("/:id", authenticate as any, charactersController.getCharacterDetails);
router.patch("/:id", authenticate as any, validate(updateCharacterSchema), charactersController.updateCharacter);
router.delete("/:id", authenticate as any, charactersController.deleteCharacter);
router.post("/:id/restore", authenticate as any, charactersController.restoreCharacter);
router.post("/:id/duplicate", authenticate as any, charactersController.duplicateCharacter);

// --- Conversation Routes ---
router.get("/conversations/all", authenticate as any, charactersController.listConversations);
router.post("/:id/conversations", authenticate as any, charactersController.startConversation);
router.get("/conversations/:convId", authenticate as any, charactersController.getConversationHistory);
router.post("/conversations/:convId/messages", authenticate as any, validate(sendMessageSchema), charactersController.sendMessage);
router.delete("/conversations/:convId", authenticate as any, charactersController.deleteConversation);
router.patch("/conversations/:convId", authenticate as any, validate(renameConversationSchema), charactersController.updateConversationMeta);

// --- Memories and Feedback Routes ---
router.get("/:id/memories", authenticate as any, charactersController.getCharacterMemories);
router.post("/:id/memories", authenticate as any, charactersController.addCharacterMemory);
router.delete("/memories/:memoryId", authenticate as any, charactersController.deleteCharacterMemory);

export default router;
