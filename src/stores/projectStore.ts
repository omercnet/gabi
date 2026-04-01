import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface GabiProject {
  id: string;
  name: string;
  directory: string;
  addedAt: number;
}

function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

interface ProjectState {
  projects: GabiProject[];
  activeProjectId: string | null;
  addProject: (name: string, directory: string) => GabiProject;
  removeProject: (id: string) => void;
  setActiveProject: (id: string | null) => void;
  getProjectById: (id: string) => GabiProject | undefined;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: [],
      activeProjectId: null,
      addProject: (name, directory) => {
        const project: GabiProject = {
          id: generateId(),
          name,
          directory,
          addedAt: Date.now(),
        };
        set((state) => ({ projects: [...state.projects, project] }));
        return project;
      },
      removeProject: (id) =>
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          activeProjectId: state.activeProjectId === id ? null : state.activeProjectId,
        })),
      setActiveProject: (id) => set({ activeProjectId: id }),
      getProjectById: (id) => get().projects.find((p) => p.id === id),
    }),
    {
      name: "gabi-projects",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
