import "../global.css";
import { Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useHydration } from "@/hooks/useHydration";

export default function RootLayout() {
  const hydrated = useHydration();

  if (!hydrated) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
