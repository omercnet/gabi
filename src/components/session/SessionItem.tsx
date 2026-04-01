import { Alert, Pressable, Text, View } from "react-native";
import type { Session } from "@/client/types";

interface Props {
  session: Session;
  onPress: () => void;
  onDelete: () => void;
}

export function SessionItem({ session, onPress, onDelete }: Props) {
  return (
    <Pressable
      className="px-4 py-2"
      onPress={onPress}
      onLongPress={() => {
        Alert.alert("Delete session?", session.title || session.id, [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: onDelete },
        ]);
      }}
    >
      <Text className="text-sm text-foreground" numberOfLines={1}>
        {session.title || "Untitled"}
      </Text>
      <Text className="text-xs text-muted">
        {new Date(session.time.updated * 1000).toLocaleDateString()}
      </Text>
    </Pressable>
  );
}
