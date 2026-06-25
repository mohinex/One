import Anthropic from "@anthropic-ai/sdk";
import { getPrisma } from "../../config/db.ts";
import { decrypt } from "../../utils/crypto.ts";

export interface StandardMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface StandardResponse {
  content: string;
  inputTokens: number;
  outputTokens: number;
  finishReason: string;
}

export async function generateAnthropicChat(
  messages: StandardMessage[],
  model: string = "claude-3-5-sonnet-20241022",
  maxTokens: number = 4096,
  stream: boolean = false
): Promise<StandardResponse> {
  const prisma = getPrisma();
  let apiKey = process.env.ANTHROPIC_API_KEY;

  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: "ai.anthropicApiKey" },
    });
    if (setting && setting.value) {
      apiKey = decrypt(setting.value);
    }
  } catch (err) {
    console.warn("Could not query DB for Anthropic Key, falling back to process.env.");
  }

  if (!apiKey || apiKey.includes("sk-ant-...")) {
    // Elegant system fallback simulation so the application works seamlessly
    return {
      content: `[Simulated Claude Response] You queried Anthropic model "${model}" with ${messages.length} messages. Since there are no Anthropic API credentials configured, Eurosia compiles this response in simulated preview mode. Keep typing to experience the full operational platform!`,
      inputTokens: 10,
      outputTokens: 40,
      finishReason: "end_turn",
    };
  }

  try {
    const anthropic = new Anthropic({ apiKey });
    
    // Extract system instructions if any
    const systemInstruction = messages.find((m) => m.role === "system")?.content;
    const formattedMessages = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    const response = await anthropic.messages.create({
      model: model,
      max_tokens: maxTokens,
      messages: formattedMessages,
      system: systemInstruction,
    });

    const textContent = response.content[0].type === "text" ? response.content[0].text : "No response text";
    
    return {
      content: textContent,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      finishReason: response.stop_reason || "stop",
    };
  } catch (error: any) {
    console.error("Anthropic API Error:", error.message);
    throw new Error(`Anthropic AI Connection issue: ${error.message}`);
  }
}
