import { Slot } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, Text, useWindowDimensions, View } from "react-native";
import { ProjectSidebar } from "@/components/project/ProjectSidebar";
import { SSEToast } from "@/components/shared";

export default function AppLayout() {
  const { width } = useWindowDimensions();
  const isWide = width >= 768;
  const [drawerOpen, setDrawerOpen] = useState(false);

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
            <Pressable onPress={() => setDrawerOpen(true)}>
              <Text className="text-foreground text-lg">☰</Text>
            </Pressable>
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
