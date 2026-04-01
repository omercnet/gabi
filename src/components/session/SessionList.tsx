import { router } from "expo-router";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import type { OpencodeClient } from "@/client/types";
import { useSessions } from "@/hooks/useSessions";
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
    <View className="pl-4">
      {sessions.map((session) => (
        <SessionItem
          key={session.id}
          session={session}
          onPress={() => {
            selectSession(session.id);
            router.push(`/(app)/${session.id}`);
          }}
          onDelete={() => deleteSession(session.id)}
        />
      ))}
      <Pressable className="px-4 py-2" onPress={handleCreate}>
        <Text className="text-xs text-primary">+ New Session</Text>
      </Pressable>
    </View>
  );
}
