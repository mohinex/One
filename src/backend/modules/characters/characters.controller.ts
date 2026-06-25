import { Response, NextFunction } from "express";
import { getPrisma } from "../../config/db.ts";
import { AppError } from "../../utils/errors.ts";
import { GoogleGenAI } from "@google/genai";
import { decrypt } from "../../utils/crypto.ts";

// Lazy-initialize Gemini client
let aiClient: GoogleGenAI | null = null;
async function getAI(): Promise<GoogleGenAI | null> {
  let key = process.env.GEMINI_API_KEY;
  
  try {
    const prisma = getPrisma();
    const setting = await prisma.siteSetting.findUnique({
      where: { key: "ai.geminiApiKey" },
    });
    if (setting && setting.value) {
      key = decrypt(setting.value);
    }
  } catch (err) {
    console.warn("Could not query DB for Gemini Key, falling back to process.env.");
  }

  if (key && key !== "MY_GEMINI_API_KEY") {
    // We recreate/reassign only if we have a valid key (caching the client if possible)
    if (!aiClient || (aiClient as any).apiKey !== key) {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: { headers: { "User-Agent": "aistudio-build" } },
      });
      // Tag it so we can check if it changed
      (aiClient as any).apiKey = key;
    }
    return aiClient;
  }
  return null;
}

// 1. List Characters (Search, Filter, Recent, Categories, Pagination)
export async function listCharacters(req: any, res: Response, next: NextFunction) {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = (req.query.search as string) || "";
    const category = (req.query.category as string) || "";
    const featuredOnly = req.query.featured === "true";
    const includeArchived = req.query.archived === "true";

    const prisma = getPrisma();
    const skip = (page - 1) * limit;

    const where: any = {
      OR: [
        { userId: null }, // Global/seeded characters
        { userId },       // User's custom characters
      ],
      isArchived: includeArchived,
    };

    if (search) {
      where.AND = [
        {
          OR: [
            { name: { contains: search } },
            { profession: { contains: search } },
            { personality: { contains: search } },
          ],
        },
      ];
    }

    if (category && category !== "All") {
      if (!where.AND) where.AND = [];
      where.AND.push({ category });
    }

    if (featuredOnly) {
      if (!where.AND) where.AND = [];
      where.AND.push({ isFeatured: true });
    }

    const [characters, total] = await Promise.all([
      prisma.character.findMany({
        where,
        orderBy: [{ isFeatured: "desc" }, { name: "asc" }],
        skip,
        take: limit,
      }),
      prisma.character.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        characters,
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

// 2. Get Single Character Details
export async function getCharacterDetails(req: any, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const prisma = getPrisma();

    const character = await prisma.character.findUnique({
      where: { id },
    });

    if (!character) {
      throw new AppError("Character not found.", 404);
    }

    // RBAC: Check visibility
    if (character.userId && character.userId !== userId && req.user.role !== "ADMIN" && req.user.role !== "SUPER_ADMIN") {
      throw new AppError("You do not have permission to view this character.", 403);
    }

    res.json({
      success: true,
      data: character,
    });
  } catch (error) {
    next(error);
  }
}

// 3. Create Custom Character
export async function createCharacter(req: any, res: Response, next: NextFunction) {
  try {
    const userId = req.user.id;
    const prisma = getPrisma();
    const {
      name,
      profession,
      category,
      avatar,
      prompt,
      personality,
      greeting,
      instructions,
      model,
      temperature,
      tools,
      permissions,
    } = req.body;

    const character = await prisma.character.create({
      data: {
        userId,
        name,
        profession,
        category,
        avatar: avatar || "bg-indigo-100 text-indigo-800 border-indigo-250",
        prompt,
        personality,
        greeting,
        instructions,
        model: model || "gemini",
        temperature: temperature ?? 0.7,
        tools: tools ? JSON.stringify(tools) : null,
        permissions: permissions ? JSON.stringify(permissions) : null,
      },
    });

    // Create SyncQueue item for change tracking/offline sync
    await prisma.syncQueue.create({
      data: {
        action: "CREATE",
        entityType: "character",
        entityId: character.id,
        payload: JSON.stringify(character),
        status: "synced",
      },
    });

    res.status(211).json({
      success: true,
      data: character,
    });
  } catch (error) {
    next(error);
  }
}

// 4. Update Character (with RBAC)
export async function updateCharacter(req: any, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const prisma = getPrisma();

    const character = await prisma.character.findUnique({
      where: { id },
    });

    if (!character) {
      throw new AppError("Character not found.", 404);
    }

    // RBAC: Check permissions
    if (character.userId !== userId && req.user.role !== "ADMIN" && req.user.role !== "SUPER_ADMIN") {
      throw new AppError("You do not have permission to edit this character.", 403);
    }

    const {
      name,
      profession,
      category,
      avatar,
      prompt,
      personality,
      greeting,
      instructions,
      model,
      temperature,
      tools,
      permissions,
      isArchived,
      isFeatured,
    } = req.body;

    const updated = await prisma.character.update({
      where: { id },
      data: {
        name,
        profession,
        category,
        avatar,
        prompt,
        personality,
        greeting,
        instructions,
        model,
        temperature,
        tools: tools ? JSON.stringify(tools) : undefined,
        permissions: permissions ? JSON.stringify(permissions) : undefined,
        isArchived,
        isFeatured: req.user.role === "ADMIN" || req.user.role === "SUPER_ADMIN" ? isFeatured : undefined,
      },
    });

    // Track in sync queue
    await prisma.syncQueue.create({
      data: {
        action: "UPDATE",
        entityType: "character",
        entityId: id,
        payload: JSON.stringify(updated),
        status: "synced",
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

// 5. Soft Delete Character
export async function deleteCharacter(req: any, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const prisma = getPrisma();

    const character = await prisma.character.findUnique({ where: { id } });
    if (!character) {
      throw new AppError("Character not found.", 404);
    }

    if (character.userId !== userId && req.user.role !== "ADMIN" && req.user.role !== "SUPER_ADMIN") {
      throw new AppError("You do not have permission to delete this character.", 403);
    }

    const updated = await prisma.character.update({
      where: { id },
      data: { isArchived: true },
    });

    await prisma.syncQueue.create({
      data: {
        action: "DELETE",
        entityType: "character",
        entityId: id,
        payload: JSON.stringify({ isArchived: true }),
        status: "synced",
      },
    });

    res.json({
      success: true,
      message: "Character soft-deleted successfully.",
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

// 6. Restore Character
export async function restoreCharacter(req: any, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const prisma = getPrisma();

    const character = await prisma.character.findUnique({ where: { id } });
    if (!character) {
      throw new AppError("Character not found.", 404);
    }

    if (character.userId !== userId && req.user.role !== "ADMIN" && req.user.role !== "SUPER_ADMIN") {
      throw new AppError("You do not have permission to restore this character.", 403);
    }

    const updated = await prisma.character.update({
      where: { id },
      data: { isArchived: false },
    });

    res.json({
      success: true,
      message: "Character restored successfully.",
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

// 7. Duplicate/Clone Character
export async function duplicateCharacter(req: any, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const prisma = getPrisma();

    const original = await prisma.character.findUnique({ where: { id } });
    if (!original) {
      throw new AppError("Original character not found.", 404);
    }

    const copy = await prisma.character.create({
      data: {
        userId,
        name: `${original.name} (Clone)`,
        profession: original.profession,
        category: original.category,
        avatar: "bg-slate-100 text-slate-800 border-slate-200",
        prompt: original.prompt,
        personality: original.personality,
        greeting: original.greeting,
        instructions: original.instructions,
        model: original.model,
        temperature: original.temperature,
        tools: original.tools,
        permissions: original.permissions,
        isArchived: false,
        isFeatured: false,
      },
    });

    res.json({
      success: true,
      message: "Character cloned successfully.",
      data: copy,
    });
  } catch (error) {
    next(error);
  }
}

// 8. List Categories
export async function listCategories(req: any, res: Response, next: NextFunction) {
  try {
    const prisma = getPrisma();
    const categories = await prisma.characterCategory.findMany({
      orderBy: { name: "asc" },
    });
    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
}

// 9. List Templates
export async function listTemplates(req: any, res: Response, next: NextFunction) {
  try {
    const prisma = getPrisma();
    const templates = await prisma.characterTemplate.findMany({
      orderBy: { name: "asc" },
    });
    res.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    next(error);
  }
}

// 10. Start Conversation
export async function startConversation(req: any, res: Response, next: NextFunction) {
  try {
    const userId = req.user.id;
    const { id: characterId } = req.params;
    const prisma = getPrisma();

    const character = await prisma.character.findUnique({ where: { id: characterId } });
    if (!character) {
      throw new AppError("Character not found.", 404);
    }

    // Create the conversation log
    const conversation = await prisma.characterConversation.create({
      data: {
        userId,
        characterId,
        title: `Dialogue with ${character.name}`,
      },
    });

    // Auto-create greeting message from character
    await prisma.conversationMessage.create({
      data: {
        conversationId: conversation.id,
        role: "assistant",
        content: character.greeting,
      },
    });

    res.status(211).json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    next(error);
  }
}

// 11. List conversations
export async function listConversations(req: any, res: Response, next: NextFunction) {
  try {
    const userId = req.user.id;
    const prisma = getPrisma();

    const conversations = await prisma.characterConversation.findMany({
      where: { userId, isArchived: false },
      include: {
        character: {
          select: { name: true, profession: true, avatar: true },
        },
      },
      orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
    });

    res.json({
      success: true,
      data: conversations,
    });
  } catch (error) {
    next(error);
  }
}

// 12. Get Conversation History
export async function getConversationHistory(req: any, res: Response, next: NextFunction) {
  try {
    const { convId } = req.params;
    const userId = req.user.id;
    const prisma = getPrisma();

    const conv = await prisma.characterConversation.findFirst({
      where: { id: convId, userId },
      include: {
        character: true,
        messages: {
          orderBy: { createdAt: "asc" },
          include: { attachments: true },
        },
      },
    });

    if (!conv) {
      throw new AppError("Conversation history not found.", 404);
    }

    res.json({
      success: true,
      data: conv,
    });
  } catch (error) {
    next(error);
  }
}

// 13. Send message & complete using Gemini + Memory
export async function sendMessage(req: any, res: Response, next: NextFunction) {
  try {
    const { convId } = req.params;
    const userId = req.user.id;
    const { content, attachments } = req.body;
    const prisma = getPrisma();

    const conversation = await prisma.characterConversation.findFirst({
      where: { id: convId, userId },
      include: { character: true },
    });

    if (!conversation) {
      throw new AppError("Conversation not found.", 404);
    }

    const character = conversation.character;

    // 1. Save user's message
    const userMsg = await prisma.conversationMessage.create({
      data: {
        conversationId: convId,
        role: "user",
        content,
      },
    });

    if (attachments && Array.isArray(attachments)) {
      for (const att of attachments) {
        await prisma.conversationAttachment.create({
          data: {
            messageId: userMsg.id,
            name: att.name || "Upload File",
            url: att.url,
            type: att.type || "pdf",
            size: att.size || 0,
          },
        });
      }
    }

    // 2. Fetch existing memories for character
    const memories = await prisma.characterMemory.findMany({
      where: { characterId: character.id },
      take: 8,
      orderBy: { createdAt: "desc" },
    });

    const memoryContext = memories.length > 0
      ? `\n[IMPORTANT: LONG-TERM MEMORIES OF PREVIOUS DIALOGUES WITH THIS USER]\n${memories.map(m => `- ${m.content}`).join("\n")}`
      : "";

    // 3. Assemble complete prompt
    const basePrompt = character.prompt;
    const personality = character.personality;
    const instructions = character.instructions || "";

    const systemPrompt = `You are roleplaying as the following custom entity:
Name: ${character.name}
Profession: ${character.profession}
Personality Specs: ${personality}
Contextual Directives: ${basePrompt}
Instructions: ${instructions}
${memoryContext}

Respond naturally to the user's latest query strictly in this persona. Always maintain context. Keep formatting pristine.`;

    // Fetch conversation history (last 10 messages) to provide as local context
    const history = await prisma.conversationMessage.findMany({
      where: { conversationId: convId },
      orderBy: { createdAt: "asc" },
      take: 12,
    });

    // Model parameter binding
    const ai = await getAI();
    let assistantText = "";

    if (!ai) {
      assistantText = `[Simulated Offline Response from ${character.name}] Gemini API Key is not set. Beautiful offline simulation is currently active with full local SQLite persistence.`;
    } else {
      try {
        // Prepare chat history list
        const contents = history.map(h => ({
          role: h.role === "user" ? "user" as const : "model" as const,
          parts: [{ text: h.content }],
        }));

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents,
          config: {
            systemInstruction: systemPrompt,
            temperature: character.temperature,
          },
        });

        assistantText = response.text || `Silence from ${character.name}...`;
      } catch (err: any) {
        assistantText = `[Neural Center Connection Error] Unable to formulate response. details: ${err.message}`;
      }
    }

    // 4. Save Assistant Response
    const assistantMsg = await prisma.conversationMessage.create({
      data: {
        conversationId: convId,
        role: "assistant",
        content: assistantText,
      },
    });

    // Update conversation timestamp
    await prisma.characterConversation.update({
      where: { id: convId },
      data: { updatedAt: new Date() },
    });

    // 5. Long-term Memory background processing (auto-improve future answers)
    // Run asynchronously to not block the response
    if (ai && content.length > 10) {
      setTimeout(async () => {
        try {
          const extractionPrompt = `Below is a dialogue snippet between a user and an AI roleplaying as "${character.name}".
User said: "${content}"
AI responded: "${assistantText}"

If this dialogue contains any notable personal facts, user preferences, names, or key summaries that should be remembered in future chats, extract them as 1-3 short, clean declarative bullet points. Do NOT include greetings, trivialities or meta-text. Return only the bullet points. If nothing is worth remembering, return "NONE".`;

          const memoRes = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: extractionPrompt,
            config: { temperature: 0.2 },
          });

          const memoTxt = memoRes.text || "";
          if (memoTxt && memoTxt.trim() !== "NONE" && !memoTxt.includes("NONE")) {
            const lines = memoTxt.split("\n").map(l => l.replace(/^-\s*/, "").trim()).filter(l => l.length > 4);
            const p = getPrisma();
            for (const line of lines) {
              await p.characterMemory.create({
                data: {
                  characterId: character.id,
                  content: line,
                  type: "fact",
                },
              });
            }
          }
        } catch (memErr) {
          console.warn("Memory extraction task warning:", memErr);
        }
      }, 500);
    }

    res.json({
      success: true,
      data: {
        message: assistantMsg,
      },
    });
  } catch (error) {
    next(error);
  }
}

// 14. Delete conversation
export async function deleteConversation(req: any, res: Response, next: NextFunction) {
  try {
    const { convId } = req.params;
    const userId = req.user.id;
    const prisma = getPrisma();

    const conversation = await prisma.characterConversation.findFirst({
      where: { id: convId, userId },
    });

    if (!conversation) {
      throw new AppError("Conversation not found.", 404);
    }

    await prisma.characterConversation.delete({
      where: { id: convId },
    });

    res.json({
      success: true,
      message: "Conversation deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
}

// 15. Update Conversation Meta (rename, pin, archive)
export async function updateConversationMeta(req: any, res: Response, next: NextFunction) {
  try {
    const { convId } = req.params;
    const userId = req.user.id;
    const { title, isPinned, isArchived } = req.body;
    const prisma = getPrisma();

    const conversation = await prisma.characterConversation.findFirst({
      where: { id: convId, userId },
    });

    if (!conversation) {
      throw new AppError("Conversation not found.", 404);
    }

    const updated = await prisma.characterConversation.update({
      where: { id: convId },
      data: {
        title,
        isPinned,
        isArchived,
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

// --- Memory Management Endpoints ---
export async function getCharacterMemories(req: any, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const prisma = getPrisma();
    const memories = await prisma.characterMemory.findMany({
      where: { characterId: id },
      orderBy: { createdAt: "desc" },
    });
    res.json({
      success: true,
      data: memories,
    });
  } catch (error) {
    next(error);
  }
}

export async function addCharacterMemory(req: any, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { content, type } = req.body;
    const prisma = getPrisma();

    const memory = await prisma.characterMemory.create({
      data: {
        characterId: id,
        content,
        type: type || "fact",
      },
    });

    res.json({
      success: true,
      data: memory,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteCharacterMemory(req: any, res: Response, next: NextFunction) {
  try {
    const { memoryId } = req.params;
    const prisma = getPrisma();

    await prisma.characterMemory.delete({
      where: { id: memoryId },
    });

    res.json({
      success: true,
      message: "Memory point removed.",
    });
  } catch (error) {
    next(error);
  }
}
