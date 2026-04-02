import { create } from "zustand";
import type { Session } from "@/client/types";

interface SessionState {
  sessionsByDirectory: Record<string, Session[]>;
  loadingByDirectory: Record<string, boolean>;
  activeSessionId: string | null;
  setSessions: (directory: string, sessions: Session[]) => void;
  upsertSession: (directory: string, session: Session) => void;
  removeSession: (directory: string, sessionId: string) => void;
  setLoading: (directory: string, loading: boolean) => void;
  setActiveSession: (id: string | null) => void;
}

export const useSessionStore = create<SessionState>()((set) => ({
  sessionsByDirectory: {},
  loadingByDirectory: {},
  activeSessionId: null,

  setSessions: (directory, sessions) =>
    set((state) => ({
      sessionsByDirectory: {
        ...state.sessionsByDirectory,
        [directory]: sessions.slice().sort((a, b) => b.time.updated - a.time.updated),
      },
    })),

  upsertSession: (directory, session) =>
    set((state) => {
      const existing = state.sessionsByDirectory[directory] ?? [];
      const idx = existing.findIndex((s) => s.id === session.id);
      const updated =
        idx >= 0 ? existing.map((s, i) => (i === idx ? session : s)) : [session, ...existing];
      const sorted = updated.sort((a, b) => b.time.updated - a.time.updated);
      return {
        sessionsByDirectory: { ...state.sessionsByDirectory, [directory]: sorted },
      };
    }),

  removeSession: (directory, sessionId) =>
    set((state) => {
      const existing = state.sessionsByDirectory[directory] ?? [];
      return {
        sessionsByDirectory: {
          ...state.sessionsByDirectory,
          [directory]: existing.filter((s) => s.id !== sessionId),
        },
        activeSessionId: state.activeSessionId === sessionId ? null : state.activeSessionId,
      };
    }),

  setLoading: (directory, loading) =>
    set((state) => ({
      loadingByDirectory: { ...state.loadingByDirectory, [directory]: loading },
    })),

  setActiveSession: (id) => set({ activeSessionId: id }),
}));
