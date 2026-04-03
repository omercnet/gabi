import { create } from "zustand";
import type { Message, Part } from "@/client/types";

interface MessageState {
  messagesBySession: Record<string, Message[]>;
  partsByMessage: Record<string, Record<string, Part>>;
  streamingSessionId: string | null;
  loadingBySession: Record<string, boolean>;

  setMessages: (sessionId: string, messages: Message[]) => void;
  upsertMessage: (sessionId: string, message: Message) => void;
  removeMessage: (sessionId: string, messageId: string) => void;
  upsertPart: (sessionId: string, messageId: string, part: Part) => void;
  removePart: (sessionId: string, messageId: string, partId: string) => void;
  setStreaming: (sessionId: string | null) => void;
  setLoading: (sessionId: string, loading: boolean) => void;
  clearSession: (sessionId: string) => void;
}

export const useMessageStore = create<MessageState>()((set) => ({
  messagesBySession: {},
  partsByMessage: {},
  streamingSessionId: null,
  loadingBySession: {},

  setMessages: (sessionId, messages) =>
    set((state) => ({
      messagesBySession: { ...state.messagesBySession, [sessionId]: messages },
    })),

  upsertMessage: (sessionId, message) =>
    set((state) => {
      const existing = state.messagesBySession[sessionId] ?? [];
      const idx = existing.findIndex((m) => m.id === message.id);
      const updated =
        idx >= 0 ? existing.map((m, i) => (i === idx ? message : m)) : [...existing, message];
      return {
        messagesBySession: { ...state.messagesBySession, [sessionId]: updated },
      };
    }),

  removeMessage: (sessionId, messageId) =>
    set((state) => {
      const existing = state.messagesBySession[sessionId] ?? [];
      return {
        messagesBySession: {
          ...state.messagesBySession,
          [sessionId]: existing.filter((m) => m.id !== messageId),
        },
      };
    }),

  upsertPart: (_sessionId, messageId, part) =>
    set((state) => {
      const msgParts = state.partsByMessage[messageId] ?? {};
      return {
        partsByMessage: {
          ...state.partsByMessage,
          [messageId]: { ...msgParts, [part.id]: part },
        },
      };
    }),

  removePart: (_sessionId, messageId, partId) =>
    set((state) => {
      const msgParts = { ...(state.partsByMessage[messageId] ?? {}) };
      delete msgParts[partId];
      return {
        partsByMessage: { ...state.partsByMessage, [messageId]: msgParts },
      };
    }),

  setStreaming: (sessionId) => set({ streamingSessionId: sessionId }),

  setLoading: (sessionId, loading) =>
    set((state) => ({
      loadingBySession: { ...state.loadingBySession, [sessionId]: loading },
    })),

  clearSession: (sessionId) =>
    set((state) => {
      const messages = state.messagesBySession[sessionId] ?? [];
      const messageIds = new Set(messages.map((m) => m.id));
      // Also clean up partsByMessage for all messages in this session
      const restParts = Object.fromEntries(
        Object.entries(state.partsByMessage).filter(([msgId]) => !messageIds.has(msgId)),
      );
      const { [sessionId]: _msgs, ...restMsgs } = state.messagesBySession;
      return { messagesBySession: restMsgs, partsByMessage: restParts };
    }),
}));
