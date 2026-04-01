import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { buildClient } from "@/client/client";
import { useConnectionStore } from "@/stores/connectionStore";

export default function SetupScreen() {
  const [url, setUrl] = useState("http://localhost:4096");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const configure = useConnectionStore((s) => s.configure);

  const handleConnect = async () => {
    setError("");
    setLoading(true);
    try {
      const client = buildClient({ baseUrl: url, username, password });
      const result = await client.global.health();
      if (result.error) {
        setError("Could not reach server");
        return;
      }
      configure(url, username, password);
      router.replace("/(app)");
    } catch {
      setError("Connection failed. Check URL and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 items-center justify-center bg-background px-6">
      <Text className="mb-8 text-3xl font-bold text-foreground">Gabi</Text>
      <Text className="mb-6 text-sm text-muted">Connect to your OpenCode server</Text>

      <View className="w-full max-w-sm gap-4">
        <TextInput
          className="rounded-lg border border-border bg-surface px-4 py-3 text-foreground"
          placeholder="http://localhost:4096"
          placeholderTextColor="#737373"
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TextInput
          className="rounded-lg border border-border bg-surface px-4 py-3 text-foreground"
          placeholder="Username (optional)"
          placeholderTextColor="#737373"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        <TextInput
          className="rounded-lg border border-border bg-surface px-4 py-3 text-foreground"
          placeholder="Password (optional)"
          placeholderTextColor="#737373"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {error ? <Text className="text-sm text-error">{error}</Text> : null}

        <Pressable
          className="items-center rounded-lg bg-primary px-4 py-3"
          onPress={handleConnect}
          disabled={loading || !url.trim()}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="font-semibold text-primary-foreground">Connect</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
