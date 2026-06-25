import { Router } from "express";
import { z } from "zod";
import { validate } from "../../middlewares/validate.ts";
import { authenticate } from "../../middlewares/authenticate.ts";
import { apiLimiter } from "../../middlewares/rateLimiters.ts";
import * as chatsController from "./chats.controller.ts";

const router = Router();

const createChatSchema = {
  body: z.object({
    title: z.string().max(100).optional(),
    modelId: z.string().min(1, "Model ID is required."),
    systemPrompt: z.string().optional(),
  }),
};

const updateChatSchema = {
  body: z.object({
    title: z.string().max(100).optional(),
    isArchived: z.boolean().optional(),
    isPinned: z.boolean().optional(),
    systemPrompt: z.string().optional(),
  }),
};

const bulkDeleteSchema = {
  body: z.object({
    ids: z.array(z.string().min(1)).min(1, "At least one chat ID must be provided."),
  }),
};

const messageSchema = {
  body: z.object({
    content: z.string().min(1, "Message content cannot be blank."),
    attachments: z
      .array(
        z.object({
          type: z.string(),
          url: z.string().url(),
        })
      )
      .optional(),
  }),
};

// Route assignments
router.get("/", authenticate as any, apiLimiter, chatsController.listChats);
router.post("/", authenticate as any, validate(createChatSchema), chatsController.createChat);
router.post("/bulk-delete", authenticate as any, validate(bulkDeleteSchema), chatsController.bulkDeleteChats);

router.get("/:id", authenticate as any, chatsController.getChatDetails);
router.patch("/:id", authenticate as any, validate(updateChatSchema), chatsController.updateChat);
router.delete("/:id", authenticate as any, chatsController.deleteChat);

router.post("/:id/messages", authenticate as any, validate(messageSchema), chatsController.createMessage);
router.post("/:id/messages/stream", authenticate as any, validate(messageSchema), chatsController.streamMessage);

export default router;
