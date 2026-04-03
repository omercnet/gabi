import Feather from "@expo/vector-icons/Feather";
import { Slot } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, Text, useWindowDimensions, View } from "react-native";
import { ProjectSidebar } from "@/components/project/ProjectSidebar";
import { useProjectStore } from "@/stores/projectStore";
import { useSessionStore } from "@/stores/sessionStore";
import { SSEToast } from "@/components/shared";

export default function AppLayout() {
  const { width } = useWindowDimensions();
  const isWide = width >= 768;
  const [drawerOpen, setDrawerOpen] = useState(false);

  const activeSessionId = useSessionStore((s) => s.activeSessionId);
  const sessionsByDirectory = useSessionStore((s) => s.sessionsByDirectory);
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const projects = useProjectStore((s) => s.projects);
  const activeProject = activeProjectId ? projects.find((p) => p.id === activeProjectId) : undefined;
  const sessions = activeProject ? (sessionsByDirectory[activeProject.directory] ?? []) : [];
  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const sessionTitle = activeSession?.title || "Gabi";

  // Close drawer when viewport becomes wide (avoids stale overlay)
  useEffect(() => {
    if (isWide) setDrawerOpen(false);
  }, [isWide]);

  return (
    <View className="flex-1 bg-background">
      {isWide ? (
        // Wide layout: sidebar + content side by side
        <View className="flex-1 flex-row">
          <View className="w-72 border-border border-r">
            <ProjectSidebar />
          </View>
          <View className="flex-1">
            <Slot />
          </View>
        </View>
      ) : (
        // Narrow layout: header bar + content
        <View className="flex-1">
          <View className="flex-row items-center border-border border-b bg-surface px-4 py-3">
            <Pressable onPress={() => setDrawerOpen(true)} className="active:opacity-80">
              <Feather name="menu" size={22} className="text-foreground" />
            </Pressable>
            <Text className="mx-3 flex-1 font-sans-medium text-foreground text-sm" numberOfLines={1}>
              {sessionTitle}
            </Text>
          </View>
          <View className="flex-1">
            <Slot />
          </View>
          {/* Mobile drawer overlay */}
          {drawerOpen && (
            <>
              <Pressable
                className="absolute inset-0 bg-black/50"
                onPress={() => setDrawerOpen(false)}
              />
              <View className="absolute bottom-0 left-0 top-0 w-72 bg-surface">
                <ProjectSidebar />
              </View>
            </>
          )}
        </View>
      )}
      <SSEToast />
    </View>
  );
}
