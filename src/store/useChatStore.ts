import { create } from 'zustand';
import { Conversation, ChatMessage, ChatContextCard } from '@/types/chat';
import { chatService } from '@/services/chatService';
import { getChatSocket } from '@/lib/socketClient';
import { getOrCreateGuestId } from '@/lib/apiClient';
import { useAuthStore } from './useAuthStore';

interface ChatStoreState {
  isOpen: boolean;
  activeConversation: Conversation | null;
  messages: ChatMessage[];
  isLoading: boolean;
  isSending: boolean;
  isAiTyping: boolean;
  isAgentTyping: boolean;
  aiStreamingText: string;
  unreadCount: number;
  draftContextCard: ChatContextCard | null;

  // Actions
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
  setDraftContextCard: (card: ChatContextCard | null) => void;
  initConversation: () => Promise<void>;
  startNewConversation: () => Promise<void>;
  syncActiveConversation: () => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  requestHandoff: (reason?: string) => Promise<void>;
  connectSocket: () => () => void;
}

export const useChatStore = create<ChatStoreState>((set, get) => ({
  isOpen: false,
  activeConversation: null,
  messages: [],
  isLoading: false,
  isSending: false,
  isAiTyping: false,
  isAgentTyping: false,
  aiStreamingText: '',
  unreadCount: 0,
  draftContextCard: null,

  openChat: () => {
    set({ isOpen: true, unreadCount: 0 });
    const { activeConversation, initConversation } = get();
    if (!activeConversation) {
      initConversation();
    } else {
      chatService.markConversationRead(activeConversation._id).catch(() => {});
    }
  },

  closeChat: () => set({ isOpen: false }),

  toggleChat: () => {
    const { isOpen, openChat, closeChat } = get();
    if (isOpen) {
      closeChat();
    } else {
      openChat();
    }
  },

  setDraftContextCard: (card) => set({ draftContextCard: card }),

  initConversation: async () => {
    set({ isLoading: true });
    try {
      // Look for most recent active or resolved conversation (exclude closed so closed chats reset)
      const existing = await chatService.getConversations();
      const visibleConversations = existing.filter((c) => c.status !== 'closed');
      let conv = visibleConversations[0];

      if (!conv) {
        const created = await chatService.createOrGetConversation({
          mode: 'ai',
          subject: 'Shopping Assistant',
        });
        conv = created.conversation;
      }

      set({ activeConversation: conv });

      if (conv) {
        if (conv._id !== 'conv_local_offline') {
          const socket = getChatSocket(useAuthStore.getState().accessToken, getOrCreateGuestId());
          if (socket) {
            socket.emit('chat:join', { conversationId: conv._id });
          }
        }
        const msgs = await chatService.getMessages(conv._id);
        set({ messages: msgs });
        chatService.markConversationRead(conv._id).catch(() => {});
      }
    } catch {
      // Fallback: If offline or initial call fails
      const fallbackConv: Conversation = {
        _id: 'conv_local_offline',
        mode: 'ai',
        status: 'bot_active',
        subject: 'Shopping Assistant',
        unreadCountCustomer: 0,
        unreadCountAgent: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      set({
        activeConversation: fallbackConv,
        messages: [
          {
            _id: 'msg_welcome',
            conversation: 'conv_local_offline',
            senderType: 'ai',
            content:
              'Hello! I am your GASH AI Assistant. How can I assist you with products, sizes, or your orders today?',
            contextCards: [],
            isRead: true,
            createdAt: new Date().toISOString(),
          },
        ],
      });
    } finally {
      set({ isLoading: false });
    }
  },

  startNewConversation: async () => {
    set({ isLoading: true });
    try {
      const created = await chatService.createOrGetConversation({
        mode: 'ai',
        subject: 'Shopping Assistant',
      });
      const conv = created.conversation;
      set({ activeConversation: conv, messages: [] });
      if (conv && conv._id !== 'conv_local_offline') {
        const socket = getChatSocket(useAuthStore.getState().accessToken, getOrCreateGuestId());
        socket?.emit('chat:join', { conversationId: conv._id });
        const msgs = await chatService.getMessages(conv._id);
        set({ messages: msgs });
      }
    } catch {
      // Ignore error
    } finally {
      set({ isLoading: false });
    }
  },

  syncActiveConversation: async () => {
    const { activeConversation, isOpen } = get();
    if (!isOpen || !activeConversation || activeConversation._id === 'conv_local_offline') {
      return;
    }
    try {
      const [convs, latestMsgs] = await Promise.all([
        chatService.getConversations(),
        chatService.getMessages(activeConversation._id),
      ]);
      const matchedConv = convs.find((c) => c._id === activeConversation._id);

      if (matchedConv?.status === 'closed') {
        set({ activeConversation: null, messages: [] });
        await get().initConversation();
        return;
      }

      set((state) => {
        if (!state.activeConversation || state.activeConversation._id !== activeConversation._id) {
          return state;
        }
        const pendingTemps = state.messages.filter((m) => m._id.startsWith('temp_'));
        const mergedMsgs = [...latestMsgs];
        for (const temp of pendingTemps) {
          if (
            !mergedMsgs.some(
              (m) =>
                m.content === temp.content &&
                (m.senderType === 'customer' || m.senderType === 'guest')
            )
          ) {
            mergedMsgs.push(temp);
          }
        }
        const sameMsgs =
          mergedMsgs.length === state.messages.length &&
          mergedMsgs.every((m, idx) => m._id === state.messages[idx]?._id);
        const nextConv = matchedConv
          ? { ...state.activeConversation, ...matchedConv }
          : state.activeConversation;
        const sameConv =
          nextConv.status === state.activeConversation.status &&
          nextConv.mode === state.activeConversation.mode &&
          nextConv.assignedAgent?._id === state.activeConversation.assignedAgent?._id;
        if (sameMsgs && sameConv) {
          return state;
        }
        return {
          ...(sameConv ? {} : { activeConversation: nextConv }),
          ...(sameMsgs ? {} : { messages: mergedMsgs }),
        };
      });
    } catch {
      // Ignore transient background sync errors
    }
  },

  sendMessage: async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed) return;

    const { activeConversation, draftContextCard, initConversation, startNewConversation } = get();
    if (!activeConversation) {
      await initConversation();
    } else if (activeConversation.status === 'closed') {
      await startNewConversation();
    }

    const conv = get().activeConversation;
    if (!conv) return;
    const currentMessages = get().messages;

    set({ isSending: true, isAiTyping: conv.mode === 'ai', aiStreamingText: '' });

    const cardPayload = draftContextCard
      ? [
          {
            cardType: draftContextCard.cardType,
            productId: draftContextCard.product?._id,
            orderId: draftContextCard.order?._id || draftContextCard.order?.orderNumber,
            note: draftContextCard.note,
          },
        ]
      : undefined;

    // Optimistic user message
    const tempId = `temp_${Date.now()}`;
    const optimisticMsg: ChatMessage = {
      _id: tempId,
      conversation: conv._id,
      senderType: 'customer',
      content: trimmed,
      contextCards: draftContextCard ? [draftContextCard] : [],
      isRead: true,
      createdAt: new Date().toISOString(),
    };

    set({
      messages: [...currentMessages, optimisticMsg],
      draftContextCard: null,
    });

    try {
      const res = await chatService.sendMessage(conv._id, {
        content: trimmed,
        contextCards: cardPayload,
      });

      // Replace optimistic message and append AI reply if returned synchronously, deduplicating against socket broadcasts
      set((state) => {
        const incoming: ChatMessage[] = [res.message];
        if (res.aiReply) {
          incoming.push(res.aiReply);
        }
        const existingIds = new Set(
          state.messages.filter((m) => m._id !== tempId).map((m) => m._id)
        );
        const dedupedNew = incoming.filter((m) => !existingIds.has(m._id));
        return {
          messages: state.messages.filter((m) => m._id !== tempId).concat(dedupedNew),
          isAiTyping: false,
          aiStreamingText: '',
        };
      });
    } catch {
      // Revert or show fallback
      set({ isAiTyping: false, aiStreamingText: '' });
    } finally {
      set({ isSending: false });
    }
  },

  requestHandoff: async (reason?: string) => {
    const { activeConversation } = get();
    if (!activeConversation) return;

    try {
      const updated = await chatService.requestHandoff(activeConversation._id, reason);
      set({ activeConversation: updated });
      if (updated._id !== 'conv_local_offline') {
        const socket = getChatSocket(useAuthStore.getState().accessToken, getOrCreateGuestId());
        socket?.emit('chat:join', { conversationId: updated._id });
        const latestMsgs = await chatService.getMessages(updated._id).catch(() => null);
        if (latestMsgs) {
          set({ messages: latestMsgs });
        }
      }
    } catch {
      // Fallback transition
      set((state) => ({
        activeConversation: state.activeConversation
          ? {
              ...state.activeConversation,
              mode: 'support',
              status: 'queued',
              handoffReason: reason,
            }
          : null,
      }));
    }
  },

  connectSocket: () => {
    const token = useAuthStore.getState().accessToken;
    const guestId = getOrCreateGuestId();
    const socket = getChatSocket(token, guestId);

    if (!socket) return () => {};

    const joinActiveRoom = () => {
      const convId = get().activeConversation?._id;
      if (convId && convId !== 'conv_local_offline') {
        socket.emit('chat:join', { conversationId: convId });
      }
    };

    const handleMessage = (data: { conversationId: string; message: ChatMessage }) => {
      const { activeConversation, isOpen } = get();
      if (!data?.message) return;

      if (activeConversation && activeConversation._id !== data.conversationId) {
        return;
      }

      set((state) => {
        if (state.messages.some((m) => m._id === data.message._id)) {
          return state;
        }

        // Remove matching optimistic message from the customer/guest if socket arrives before HTTP ack
        const filtered = state.messages.filter(
          (m) =>
            !(
              m._id.startsWith('temp_') &&
              m.content === data.message.content &&
              (data.message.senderType === 'customer' || data.message.senderType === 'guest')
            )
        );

        return {
          messages: [...filtered, data.message],
          isAiTyping: false,
          aiStreamingText: '',
          unreadCount: !isOpen ? state.unreadCount + 1 : 0,
        };
      });

      if (isOpen && activeConversation?._id === data.conversationId) {
        chatService.markConversationRead(data.conversationId).catch(() => {});
      }
    };

    const handleAiTyping = (data: { conversationId: string; isTyping: boolean }) => {
      const activeId = get().activeConversation?._id;
      if (!activeId || activeId === data?.conversationId) {
        set({ isAiTyping: Boolean(data?.isTyping) });
      }
    };

    const handleAiChunk = (data: { conversationId: string; chunk: string }) => {
      const activeId = get().activeConversation?._id;
      if (data?.chunk && (!activeId || activeId === data?.conversationId)) {
        set((state) => ({ aiStreamingText: state.aiStreamingText + data.chunk }));
      }
    };

    const handleTyping = (data: {
      conversationId?: string;
      senderRole: string;
      isTyping: boolean;
    }) => {
      const activeId = get().activeConversation?._id;
      if (data?.conversationId && activeId && data.conversationId !== activeId) {
        return;
      }
      if (data?.senderRole === 'admin' || data?.senderRole === 'seller') {
        set({ isAgentTyping: Boolean(data.isTyping) });
      }
    };

    const handleHandoff = (data: {
      conversationId?: string;
      status: Conversation['status'];
      mode: Conversation['mode'];
    }) => {
      set((state) => ({
        activeConversation:
          state.activeConversation &&
          (!data.conversationId || state.activeConversation._id === data.conversationId)
            ? { ...state.activeConversation, status: data.status, mode: data.mode }
            : state.activeConversation,
      }));
    };

    const handleAssigned = (data: {
      conversationId: string;
      status?: Conversation['status'];
      mode?: Conversation['mode'];
      assignedAgent?: Conversation['assignedAgent'];
    }) => {
      set((state) => ({
        activeConversation:
          state.activeConversation && state.activeConversation._id === data.conversationId
            ? {
                ...state.activeConversation,
                status: data.status || 'assigned',
                mode: data.mode || 'support',
                assignedAgent: data.assignedAgent ?? state.activeConversation.assignedAgent,
              }
            : state.activeConversation,
      }));
    };

    const handleStatusUpdated = (data: {
      conversationId: string;
      status: Conversation['status'];
      mode?: Conversation['mode'];
    }) => {
      if (data.status === 'closed') {
        const current = get().activeConversation;
        if (current && current._id === data.conversationId) {
          set({ activeConversation: null, messages: [] });
          if (get().isOpen) {
            get().initConversation();
          }
        }
        return;
      }

      set((state) => ({
        activeConversation:
          state.activeConversation && state.activeConversation._id === data.conversationId
            ? {
                ...state.activeConversation,
                status: data.status,
                mode: data.mode || state.activeConversation.mode,
              }
            : state.activeConversation,
      }));
    };

    socket.on('connect', joinActiveRoom);
    socket.on('chat:message', handleMessage);
    socket.on('chat:ai_typing', handleAiTyping);
    socket.on('chat:ai_chunk', handleAiChunk);
    socket.on('chat:typing', handleTyping);
    socket.on('chat:handoff_occurred', handleHandoff);
    socket.on('chat:assigned', handleAssigned);
    socket.on('chat:status_updated', handleStatusUpdated);

    // Join active conversation room immediately if already connected
    joinActiveRoom();

    return () => {
      socket.off('connect', joinActiveRoom);
      socket.off('chat:message', handleMessage);
      socket.off('chat:ai_typing', handleAiTyping);
      socket.off('chat:ai_chunk', handleAiChunk);
      socket.off('chat:typing', handleTyping);
      socket.off('chat:handoff_occurred', handleHandoff);
      socket.off('chat:assigned', handleAssigned);
      socket.off('chat:status_updated', handleStatusUpdated);
    };
  },
}));
