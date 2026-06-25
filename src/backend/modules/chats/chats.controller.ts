import { Response, NextFunction } from "express";
import { getPrisma } from "../../config/db.ts";
import { routeChat } from "../../services/ai/router.ts";
import { AppError } from "../../utils/errors.ts";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { decrypt } from "../../utils/crypto.ts";

export async function listChats(req: any, res: Response, next: NextFunction) {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = (req.query.search as string) || "";
    const archived = req.query.archived === "true";

    const prisma = getPrisma();
    const skip = (page - 1) * limit;

    const where: any = {
      userId,
      isArchived: archived,
    };

    if (search) {
      where.title = {
        contains: search,
        mode: "insensitive",
      };
    }

    const [chats, total] = await Promise.all([
      prisma.chat.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
        include: {
          _count: { select: { messages: true } },
        },
      }),
      prisma.chat.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        chats: chats.map((chat) => ({
          ...chat,
          messageCount: chat._count.messages,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function createChat(req: any, res: Response, next: NextFunction) {
  try {
    const userId = req.user.id;
    const { title, modelId, systemPrompt } = req.body;
    const prisma = getPrisma();

    // Verification plan limits
    const [userUsage, subscription] = await Promise.all([
      prisma.userUsage.findUnique({ where: { userId } }),
      prisma.subscription.findUnique({
        where: { userId },
        include: { plan: true },
      }),
    ]);

    let chatLimit = 100; // Free defaults
    if (subscription && subscription.plan && subscription.plan.features) {
      const feats = subscription.plan.features as any;
      chatLimit = feats.chatLimit || 100;
    }

    if (userUsage && userUsage.chatCount >= chatLimit) {
      throw new AppError("You have exceeded your plan's chat limit allocation. Please upgrade your description panel.", 403, "LIMIT_EXCEEDED");
    }

    // Begin chat instantiation
    const chat = await prisma.$transaction(async (tx) => {
      const newChat = await tx.chat.create({
        data: {
          userId,
          title: title || "New Conversations",
          modelId,
          systemPrompt,
        },
      });

      if (systemPrompt) {
        await tx.message.create({
          data: {
            chatId: newChat.id,
            role: "system",
            content: systemPrompt,
          },
        });
      }

      await tx.activity.create({
        data: {
          userId,
          type: "chat",
          title: "Created conversation",
          description: `Initialized chat panel with model: ${modelId}`,
          resourceId: newChat.id,
        },
      });

      return newChat;
    });

    res.status(201).json({
      success: true,
      data: chat,
    });
  } catch (error) {
    next(error);
  }
}

export async function getChatDetails(req: any, res: Response, next: NextFunction) {
  try {
    const userId = req.user.id;
    const chatId = req.params.id;
    const prisma = getPrisma();

    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          take: 50,
        },
      },
    });

    if (!chat) {
      throw new AppError("Selected conversation thread not found.", 404, "CHAT_NOT_FOUND");
    }

    if (chat.userId !== userId) {
      throw new AppError("Access denied to conversation.", 403, "FORBIDDEN");
    }

    res.json({
      success: true,
      data: chat,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateChat(req: any, res: Response, next: NextFunction) {
  try {
    const userId = req.user.id;
    const chatId = req.params.id;
    const { title, isArchived, isPinned, systemPrompt } = req.body;
    const prisma = getPrisma();

    const chat = await prisma.chat.findUnique({ where: { id: chatId } });
    if (!chat) {
      throw new AppError("Selected conversation thread not found.", 404, "CHAT_NOT_FOUND");
    }

    if (chat.userId !== userId) {
      throw new AppError("Access denied to conversation.", 403, "FORBIDDEN");
    }

    const updated = await prisma.chat.update({
      where: { id: chatId },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(isArchived !== undefined ? { isArchived } : {}),
        ...(isPinned !== undefined ? { isPinned } : {}),
        ...(systemPrompt !== undefined ? { systemPrompt } : {}),
      },
    });

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteChat(req: any, res: Response, next: NextFunction) {
  try {
    const userId = req.user.id;
    const chatId = req.params.id;
    const prisma = getPrisma();

    const chat = await prisma.chat.findUnique({ where: { id: chatId } });
    if (!chat) {
      throw new AppError("Selected conversation thread not found.", 404, "CHAT_NOT_FOUND");
    }

    if (chat.userId !== userId) {
      throw new AppError("Access denied to conversation.", 403, "FORBIDDEN");
    }

    await prisma.chat.delete({ where: { id: chatId } });

    res.json({
      success: true,
      message: "Chat has been permanently deleted from database archives.",
    });
  } catch (error) {
    next(error);
  }
}

export async function bulkDeleteChats(req: any, res: Response, next: NextFunction) {
  try {
    const userId = req.user.id;
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new AppError("No chat IDs provided for mass deletion.", 400, "BAD_REQUEST");
    }

    const prisma = getPrisma();

    // Verify ownership of the specified chats
    const chats = await prisma.chat.findMany({
      where: {
        id: { in: ids },
        userId,
      },
      select: { id: true },
    });

    const validIds = chats.map((c) => c.id);

    if (validIds.length === 0) {
      throw new AppError("None of the specified chats belong to your account.", 403, "FORBIDDEN");
    }

    // Perform mass deletion
    const deleteResult = await prisma.chat.deleteMany({
      where: {
        id: { in: validIds },
        userId,
      },
    });

    res.json({
      success: true,
      message: `${deleteResult.count} chats have been permanently deleted from database archives.`,
      deletedCount: deleteResult.count,
    });
  } catch (error) {
    next(error);
  }
}

export async function createMessage(req: any, res: Response, next: NextFunction) {
  try {
    const userId = req.user.id;
    const chatId = req.params.id;
    const { content, attachments } = req.body;
    const prisma = getPrisma();

    const chat = await prisma.chat.findUnique({ where: { id: chatId } });
    if (!chat) {
      throw new AppError("Specified conversation not found.", 404, "CHAT_NOT_FOUND");
    }

    if (chat.userId !== userId) {
      throw new AppError("Access denied to conversation.", 403, "FORBIDDEN");
    }

    // Save User message
    await prisma.message.create({
      data: {
        chatId: chat.id,
        role: "user",
        content,
        metadata: attachments ? { attachments } : undefined,
      },
    });

    // Retrieve context history (last 20 messages)
    const contextHistory = await prisma.message.findMany({
      where: { chatId: chat.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const messages = contextHistory
      .reverse()
      .map((m) => ({
        role: m.role as "user" | "assistant" | "system",
        content: m.content,
      }));

    // Trigger AI compilation
    const aiResult = await routeChat(messages, chat.modelId);

    // Save response, update limits in transaction
    const savedMessage = await prisma.$transaction(async (tx) => {
      const assistantMessage = await tx.message.create({
        data: {
          chatId: chat.id,
          role: "assistant",
          content: aiResult.content,
          inputTokens: aiResult.inputTokens,
          outputTokens: aiResult.outputTokens,
          model: chat.modelId,
          finishReason: aiResult.finishReason,
        },
      });

      // Update counters
      await tx.userUsage.update({
        where: { userId },
        data: {
          chatCount: { increment: 1 },
          totalTokensIn: { increment: aiResult.inputTokens },
          totalTokensOut: { increment: aiResult.outputTokens },
        },
      });

      await tx.chat.update({
        where: { id: chat.id },
        data: {
          messageCount: { increment: 2 },
          totalTokens: { increment: aiResult.inputTokens + aiResult.outputTokens },
          updatedAt: new Date(),
        },
      });

      await tx.activity.create({
        data: {
          userId,
          type: "chat",
          title: "AI Response Compiled",
          description: `Executed query using model: ${chat.modelId} (Total Tokens: ${aiResult.inputTokens + aiResult.outputTokens})`,
          resourceId: assistantMessage.id,
        },
      });

      return assistantMessage;
    });

    res.json({
      success: true,
      data: {
        message: {
          id: savedMessage.id,
          role: "assistant",
          content: savedMessage.content,
          createdAt: savedMessage.createdAt,
        },
        tokensUsed: {
          input: aiResult.inputTokens,
          output: aiResult.outputTokens,
          total: aiResult.inputTokens + aiResult.outputTokens,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function streamMessage(req: any, res: Response, next: NextFunction) {
  try {
    const userId = req.user.id;
    const chatId = req.params.id;
    const { content } = req.body;
    const prisma = getPrisma();

    const chat = await prisma.chat.findUnique({ where: { id: chatId } });
    if (!chat) {
      throw new AppError("Specified conversation not found.", 404, "CHAT_NOT_FOUND");
    }

    if (chat.userId !== userId) {
      throw new AppError("Access denied to conversation.", 403, "FORBIDDEN");
    }

    // Save prompt message
    await prisma.message.create({
      data: {
        chatId: chat.id,
        role: "user",
        content,
      },
    });

    // Establish Server-Sent Events headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Retrieve context history (last 20 messages)
    const contextHistory = await prisma.message.findMany({
      where: { chatId: chat.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const messages = contextHistory
      .reverse()
      .map((m) => ({
        role: m.role as "user" | "assistant" | "system",
        content: m.content,
      }));

    // Check credentials to see if we run real streaming or a clean preview timeline stream
    const normalizedModel = chat.modelId.toLowerCase();
    const isClaude = normalizedModel.startsWith("claude") || normalizedModel.includes("anthropic");
    
    let apiKey = isClaude ? process.env.ANTHROPIC_API_KEY : process.env.OPENAI_API_KEY;

    try {
      const setting = await prisma.siteSetting.findUnique({
        where: { key: isClaude ? "ai.anthropicApiKey" : "ai.openaiApiKey" },
      });
      if (setting && setting.value) apiKey = decrypt(setting.value);
    } catch {
      // ignore, fall back
    }

    let compiledResponse = "";
    let inputTokens = 12;
    let outputTokens = 0;

    if (!apiKey || apiKey.includes("sk-ant-...") || apiKey.includes("sk-...")) {
      // Mock stream simulation
      const fullText = `[Streaming Sim] This is Eurosia Stream Controller running elegantly for model "${chat.modelId}". Make sure to configure your API keys to replace this mockup.`;
      const words = fullText.split(" ");
      
      for (const word of words) {
        compiledResponse += (word + " ");
        res.write(`data: ${JSON.stringify({ chunk: word + " ", done: false })}\n\n`);
        await new Promise((resolve) => setTimeout(resolve, 80));
      }

      outputTokens = words.length;
      res.write(`data: ${JSON.stringify({ chunk: "", done: true, usage: { inputTokens, outputTokens } })}\n\n`);
    } else {
      // Call genuine API streaming
      if (isClaude) {
        const anthropic = new Anthropic({ apiKey });
        const systemInstruction = messages.find((m) => m.role === "system")?.content;
        const formattedMessages = messages
          .filter((m) => m.role !== "system")
          .map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          }));

        const stream = await anthropic.messages.create({
          max_tokens: 4096,
          messages: formattedMessages,
          model: chat.modelId,
          system: systemInstruction,
          stream: true,
        });

        for await (const event of stream) {
          const ev = event as any;
          if (ev.type === "content_block_delta" && ev.delta?.type === "text") {
            const chunk = ev.delta.text;
            compiledResponse += chunk;
            res.write(`data: ${JSON.stringify({ chunk, done: false })}\n\n`);
          }
        }
        res.write(`data: ${JSON.stringify({ chunk: "", done: true })}\n\n`);
      } else {
        const openai = new OpenAI({ apiKey });
        const stream = await openai.chat.completions.create({
          model: chat.modelId,
          messages: messages as any,
          stream: true,
        });

        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content || "";
          compiledResponse += text;
          if (text) {
            res.write(`data: ${JSON.stringify({ chunk: text, done: false })}\n\n`);
          }
        }
        res.write(`data: ${JSON.stringify({ chunk: "", done: true })}\n\n`);
      }
    }

    // Save final message to database
    const finalMsg = await prisma.message.create({
      data: {
        chatId: chat.id,
        role: "assistant",
        content: compiledResponse,
        model: chat.modelId,
        inputTokens,
        outputTokens,
      },
    });

    // Update database aggregates
    await prisma.userUsage.update({
      where: { userId },
      data: {
        chatCount: { increment: 1 },
        totalTokensIn: { increment: inputTokens },
        totalTokensOut: { increment: outputTokens },
      },
    });

    await prisma.chat.update({
      where: { id: chat.id },
      data: {
        messageCount: { increment: 2 },
        totalTokens: { increment: inputTokens + outputTokens },
        updatedAt: new Date(),
      },
    });

    res.end();
  } catch (error) {
    next(error);
  }
}
