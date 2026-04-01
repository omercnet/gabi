import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { SSEStatus } from "@/client/types";

interface ConnectionState {
  baseUrl: string;
  username: string;
  password: string;
  isConfigured: boolean;
  health: "unknown" | "healthy" | "unhealthy";
  sseStatus: SSEStatus;
  configure: (baseUrl: string, username?: string, password?: string) => void;
  setHealth: (health: ConnectionState["health"]) => void;
  setSseStatus: (status: SSEStatus) => void;
  reset: () => void;
}

const initialState = {
  baseUrl: "",
  username: "",
  password: "",
  isConfigured: false,
  health: "unknown" as const,
  sseStatus: "disconnected" as SSEStatus,
};

export const useConnectionStore = create<ConnectionState>()(
  persist(
    (set) => ({
      ...initialState,
      configure: (baseUrl, username = "", password = "") =>
        set({ baseUrl, username, password, isConfigured: true }),
      setHealth: (health) => set({ health }),
      setSseStatus: (sseStatus) => set({ sseStatus }),
      reset: () => set(initialState),
    }),
    {
      name: "gabi-connection",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        baseUrl: state.baseUrl,
        username: state.username,
        password: state.password,
        isConfigured: state.isConfigured,
      }),
    },
  ),
);
