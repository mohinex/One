import api from "../lib/api.ts";

export interface Character {
  id: string;
  userId?: string | null;
  name: string;
  profession: string;
  category: string;
  avatar?: string | null;
  prompt: string;
  personality: string;
  greeting: string;
  instructions?: string | null;
  model: string;
  temperature: number;
  tools?: string | null; // JSON list
  permissions?: string | null; // JSON object
  isArchived: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CharacterCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
}

export interface CharacterTemplate {
  id: string;
  name: string;
  profession: string;
  category: string;
  avatar?: string | null;
  prompt: string;
  personality: string;
  greeting: string;
  instructions?: string | null;
  model: string;
  temperature: number;
  tools?: string | null;
}

export interface CharacterMemory {
  id: string;
  characterId: string;
  content: string;
  type: string;
  createdAt: string;
}

export interface ConversationAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface ConversationMessage {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
  attachments?: ConversationAttachment[];
}

export interface CharacterConversation {
  id: string;
  userId: string;
  characterId: string;
  title: string;
  isPinned: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  character?: {
    name: string;
    profession: string;
    avatar?: string | null;
  };
  messages?: ConversationMessage[];
}

export const characterService = {
  // Characters
  async getCharacters(params?: {
    search?: string;
    category?: string;
    featured?: boolean;
    archived?: boolean;
    page?: number;
    limit?: number;
  }) {
    const res = await api.get<{
      success: boolean;
      data: {
        characters: Character[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
      };
    }>("/characters", { params });
    return res.data;
  },

  async getCharacterDetails(id: string) {
    const res = await api.get<{ success: boolean; data: Character }>(`/characters/${id}`);
    return res.data;
  },

  async createCharacter(data: Partial<Character>) {
    const res = await api.post<{ success: boolean; data: Character }>("/characters", data);
    return res.data;
  },

  async updateCharacter(id: string, data: Partial<Character>) {
    const res = await api.patch<{ success: boolean; data: Character }>(`/characters/${id}`, data);
    return res.data;
  },

  async deleteCharacter(id: string) {
    const res = await api.delete<{ success: boolean; message: string }>(`/characters/${id}`);
    return res.data;
  },

  async restoreCharacter(id: string) {
    const res = await api.post<{ success: boolean; message: string }>(`/characters/${id}/restore`);
    return res.data;
  },

  async duplicateCharacter(id: string) {
    const res = await api.post<{ success: boolean; data: Character }>(`/characters/${id}/duplicate`);
    return res.data;
  },

  // Categories
  async getCategories() {
    const res = await api.get<{ success: boolean; data: CharacterCategory[] }>("/characters/categories");
    return res.data;
  },

  // Templates
  async getTemplates() {
    const res = await api.get<{ success: boolean; data: CharacterTemplate[] }>("/characters/templates");
    return res.data;
  },

  // Conversations
  async listConversations() {
    const res = await api.get<{ success: boolean; data: CharacterConversation[] }>("/characters/conversations/all");
    return res.data;
  },

  async startConversation(characterId: string) {
    const res = await api.post<{ success: boolean; data: CharacterConversation }>(`/characters/${characterId}/conversations`);
    return res.data;
  },

  async getConversationHistory(convId: string) {
    const res = await api.get<{ success: boolean; data: CharacterConversation }>(`/characters/conversations/${convId}`);
    return res.data;
  },

  async sendMessage(convId: string, content: string, attachments?: Partial<ConversationAttachment>[]) {
    const res = await api.post<{ success: boolean; data: { message: ConversationMessage } }>(
      `/characters/conversations/${convId}/messages`,
      { content, attachments }
    );
    return res.data;
  },

  async deleteConversation(convId: string) {
    const res = await api.delete<{ success: boolean; message: string }>(`/characters/conversations/${convId}`);
    return res.data;
  },

  async updateConversationMeta(convId: string, data: { title?: string; isPinned?: boolean; isArchived?: boolean }) {
    const res = await api.patch<{ success: boolean; data: CharacterConversation }>(
      `/characters/conversations/${convId}`,
      data
    );
    return res.data;
  },

  // Memories
  async getCharacterMemories(id: string) {
    const res = await api.get<{ success: boolean; data: CharacterMemory[] }>(`/characters/${id}/memories`);
    return res.data;
  },

  async addCharacterMemory(id: string, content: string, type: string = "fact") {
    const res = await api.post<{ success: boolean; data: CharacterMemory }>(`/characters/${id}/memories`, {
      content,
      type,
    });
    return res.data;
  },

  async deleteCharacterMemory(memoryId: string) {
    const res = await api.delete<{ success: boolean; message: string }>(`/characters/memories/${memoryId}`);
    return res.data;
  }
};
