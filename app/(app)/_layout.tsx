import { Slot } from "expo-router";
import { useWindowDimensions, View } from "react-native";
import { ProjectSidebar } from "@/components/project/ProjectSidebar";

export default function AppLayout() {
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  return (
    <View className="flex-1 flex-row bg-background">
      {isWide ? (
        <View className="w-72 border-r border-border">
          <ProjectSidebar />
        </View>
      ) : null}
      <View className="flex-1">
        <Slot />
      </View>
    </View>
  );
}
