import { request } from '@/lib/apiClient';
import {
  Conversation,
  ChatMessage,
  CreateConversationPayload,
  SendMessagePayload,
} from '@/types/chat';

export interface ApiResponseWrapper<T> {
  status: 'success' | 'fail' | 'error';
  data: T;
  pagination?: {
    page: number;
    limit: number;
    totalPages: number;
    totalResults: number;
  };
}

export const chatService = {
  /**
   * Starts a new chat conversation or retrieves an open one.
   */
  async createOrGetConversation(
    payload: CreateConversationPayload
  ): Promise<{ conversation: Conversation; initialMessage?: ChatMessage }> {
    const res = await request<
      ApiResponseWrapper<{ conversation: Conversation; initialMessage?: ChatMessage }>
    >('/chat/conversations', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  /**
   * Retrieves conversation history for the current user or guest.
   */
  async getConversations(): Promise<Conversation[]> {
    const res =
      await request<ApiResponseWrapper<{ conversations: Conversation[] }>>('/chat/conversations');
    return res.data.conversations || [];
  },

  /**
   * Retrieves messages for an active conversation.
   */
  async getMessages(conversationId: string, page = 1, limit = 50): Promise<ChatMessage[]> {
    const res = await request<ApiResponseWrapper<{ messages: ChatMessage[] }>>(
      `/chat/conversations/${conversationId}/messages`,
      {
        params: { page, limit },
      }
    );
    return res.data.messages || [];
  },

  /**
   * Sends a message in a conversation.
   */
  async sendMessage(
    conversationId: string,
    payload: SendMessagePayload
  ): Promise<{ message: ChatMessage; aiReply?: ChatMessage }> {
    const res = await request<ApiResponseWrapper<{ message: ChatMessage; aiReply?: ChatMessage }>>(
      `/chat/conversations/${conversationId}/messages`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
    return res.data;
  },

  /**
   * Escalates AI chat to live human support.
   */
  async requestHandoff(conversationId: string, reason?: string): Promise<Conversation> {
    const res = await request<ApiResponseWrapper<{ conversation: Conversation }>>(
      `/chat/conversations/${conversationId}/handoff`,
      {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }
    );
    return res.data.conversation;
  },

  /**
   * Marks unread messages in conversation as read.
   */
  async markConversationRead(conversationId: string): Promise<void> {
    await request(`/chat/conversations/${conversationId}/read`, {
      method: 'PATCH',
    });
  },

  /**
   * Merges guest conversations into authenticated user account.
   */
  async mergeGuestChat(guestId: string): Promise<number> {
    const res = await request<ApiResponseWrapper<{ mergedConversations: number }>>('/chat/merge', {
      method: 'POST',
      body: JSON.stringify({ guestId }),
    });
    return res.data.mergedConversations || 0;
  },
};
