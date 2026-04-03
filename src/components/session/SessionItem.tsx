import { Alert, Pressable, Text, View } from "react-native";
import type { Session } from "@/client/types";

interface Props {
  session: Session;
  onPress: () => void;
  onDelete: () => void;
  isActive?: boolean;
}

export function SessionItem({ session, onPress, onDelete, isActive }: Props) {
  const initial = (session.title || "U").charAt(0).toUpperCase();
  return (
    <Pressable
      className={`flex-row items-center gap-2.5 px-4 py-2.5 active:opacity-80 ${isActive ? "border-l-2 border-primary bg-primary/5" : "border-l-2 border-transparent"}`}
      onPress={onPress}
      onLongPress={() => {
        Alert.alert("Delete session?", session.title || session.id, [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: onDelete },
        ]);
      }}
    >
      <View className="h-7 w-7 items-center justify-center rounded-full bg-primary/15">
        <Text className="font-sans-bold text-primary text-xs">{initial}</Text>
      </View>
      <View className="flex-1">
        <Text
          className={`text-sm ${isActive ? "font-sans-medium text-foreground" : "text-foreground"}`}
          numberOfLines={1}
        >
          {session.title || "Untitled"}
        </Text>
        <Text className="text-muted text-xs">
          {session.time?.updated == null
            ? ""
            : new Date(session.time.updated).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
        </Text>
      </View>
    </Pressable>
  );
}
