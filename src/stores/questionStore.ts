import { create } from "zustand";
import type { QuestionRequest } from "@/client/types";

interface QuestionState {
  pending: QuestionRequest[];
  upsert: (request: QuestionRequest) => void;
  remove: (id: string) => void;
  clear: () => void;
}

export const useQuestionStore = create<QuestionState>()((set) => ({
  pending: [],
  upsert: (request) =>
    set((state) => {
      const idx = state.pending.findIndex((q) => q.id === request.id);
      if (idx >= 0) {
        return { pending: state.pending.map((q, i) => (i === idx ? request : q)) };
      }
      return { pending: [...state.pending, request] };
    }),
  remove: (id) => set((state) => ({ pending: state.pending.filter((q) => q.id !== id) })),
  clear: () => set({ pending: [] }),
}));
