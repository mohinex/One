import { generateAnthropicChat, StandardMessage, StandardResponse } from "./anthropic.service.ts";
import { generateOpenAIChat } from "./openai.service.ts";

export async function routeChat(
  messages: StandardMessage[],
  modelId: string,
  maxTokens: number = 2048,
  stream: boolean = false
): Promise<StandardResponse> {
  const normalizedModel = modelId.toLowerCase();

  if (normalizedModel.startsWith("claude") || normalizedModel.includes("anthropic")) {
    return generateAnthropicChat(messages, modelId, maxTokens, stream);
  } else {
    // defaults to OpenAI for gpt, o1, etc.
    return generateOpenAIChat(messages, modelId, maxTokens, stream);
  }
}
