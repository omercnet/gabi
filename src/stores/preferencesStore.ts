import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type ColorScheme = "system" | "light" | "dark";

interface PreferencesState {
  showReasoning: boolean;
  showToolCalls: boolean;
  showStepMarkers: boolean;
  showFileParts: boolean;
  collapseToolGroups: boolean;
  colorScheme: ColorScheme;
  setShowReasoning: (v: boolean) => void;
  setShowToolCalls: (v: boolean) => void;
  setShowStepMarkers: (v: boolean) => void;
  setShowFileParts: (v: boolean) => void;
  setCollapseToolGroups: (v: boolean) => void;
  setColorScheme: (v: ColorScheme) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      showReasoning: true,
      showToolCalls: true,
      showStepMarkers: false,
      showFileParts: true,
      collapseToolGroups: true,
      colorScheme: "system" as ColorScheme,
      setShowReasoning: (v) => set({ showReasoning: v }),
      setShowToolCalls: (v) => set({ showToolCalls: v }),
      setShowStepMarkers: (v) => set({ showStepMarkers: v }),
      setShowFileParts: (v) => set({ showFileParts: v }),
      setCollapseToolGroups: (v) => set({ collapseToolGroups: v }),
      setColorScheme: (v) => set({ colorScheme: v }),
    }),
    {
      name: "gabi-preferences",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
