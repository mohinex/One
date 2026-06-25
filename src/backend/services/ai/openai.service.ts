import OpenAI from "openai";
import { getPrisma } from "../../config/db.ts";
import { decrypt } from "../../utils/crypto.ts";
import { StandardMessage, StandardResponse } from "./anthropic.service.ts";

export async function generateOpenAIChat(
  messages: StandardMessage[],
  model: string = "gpt-4o-mini",
  maxTokens: number = 2048,
  stream: boolean = false
): Promise<StandardResponse> {
  const prisma = getPrisma();
  let apiKey = process.env.OPENAI_API_KEY;

  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: "ai.openaiApiKey" },
    });
    if (setting && setting.value) {
      apiKey = decrypt(setting.value);
    }
  } catch (err) {
    console.warn("Could not query DB for OpenAI Key, falling back to process.env.");
  }

  if (!apiKey || apiKey.includes("sk-...")) {
    return {
      content: `[Simulated OpenAI Response] You queried OpenAI model "${model}". For native execution and live API responses, make sure to add your OpenAI key in the Admin settings dashboard or .env file.`,
      inputTokens: 12,
      outputTokens: 35,
      finishReason: "stop",
    };
  }

  try {
    const openai = new OpenAI({ apiKey });
    
    // Convert messages to OpenAI Format
    const formattedMessages = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const response = await openai.chat.completions.create({
      model: model,
      messages: formattedMessages as any,
      max_tokens: maxTokens,
    });

    const textContent = response.choices[0]?.message?.content || "No response content";
    
    return {
      content: textContent,
      inputTokens: response.usage?.prompt_tokens || 0,
      outputTokens: response.usage?.completion_tokens || 0,
      finishReason: response.choices[0]?.finish_reason || "stop",
    };
  } catch (error: any) {
    console.error("OpenAI API Error:", error.message);
    throw new Error(`OpenAI Connection issue: ${error.message}`);
  }
}
