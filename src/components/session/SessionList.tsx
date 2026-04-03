import Feather from "@expo/vector-icons/Feather";
import { router } from "expo-router";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import type { OpencodeClient } from "@/client/types";
import { useSessions } from "@/hooks/useSessions";
import { useSessionStore } from "@/stores/sessionStore";
import { SessionItem } from "./SessionItem";

interface Props {
  client: OpencodeClient | null;
  directory: string;
}

export function SessionList({ client, directory }: Props) {
  const { sessions, isLoading, createSession, deleteSession, selectSession } = useSessions(
    client,
    directory,
  );

  const activeSessionId = useSessionStore((s) => s.activeSessionId);

  const handleCreate = async () => {
    const session = await createSession();
    if (session && "id" in session) {
      selectSession(session.id);
      router.push(`/(app)/${session.id}`);
    }
  };

  if (isLoading) {
    return (
      <View className="px-4 py-2">
        <ActivityIndicator size="small" />
      </View>
    );
  }

  return (
    <View>
      {sessions.map((session) => (
        <SessionItem
          key={session.id}
          session={session}
          onPress={() => {
            selectSession(session.id);
            router.push(`/(app)/${session.id}`);
          }}
          onDelete={() => deleteSession(session.id)}
          isActive={session.id === activeSessionId}
        />
      ))}
      <Pressable className="px-4 py-2 active:opacity-80" onPress={handleCreate}>
        <View className="flex-row items-center gap-1">
          <Feather name="plus" size={12} className="text-primary" />
          <Text className="text-primary text-xs">New Session</Text>
        </View>
      </Pressable>
    </View>
  );
}
