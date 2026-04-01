import { create } from "zustand";
import type { PermissionRequest } from "@/client/types";

interface PermissionState {
  pending: PermissionRequest[];
  upsert: (request: PermissionRequest) => void;
  remove: (id: string) => void;
  clear: () => void;
}

export const usePermissionStore = create<PermissionState>()((set) => ({
  pending: [],
  upsert: (request) =>
    set((state) => {
      const idx = state.pending.findIndex((p) => p.id === request.id);
      if (idx >= 0) {
        return { pending: state.pending.map((p, i) => (i === idx ? request : p)) };
      }
      return { pending: [...state.pending, request] };
    }),
  remove: (id) => set((state) => ({ pending: state.pending.filter((p) => p.id !== id) })),
  clear: () => set({ pending: [] }),
}));
