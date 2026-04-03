import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { buildClient } from "@/client/client";
import { usePlaceholderColor } from "@/lib/colors";
import { useConnectionStore } from "@/stores/connectionStore";

export default function SetupScreen() {
  const placeholderColor = usePlaceholderColor();
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
      <Text className="mb-8 font-bold text-3xl text-foreground">Gabi</Text>
      <Text className="mb-6 text-muted text-sm">Connect to your OpenCode server</Text>

      <View className="w-full max-w-sm gap-4">
        <TextInput
          className="rounded-lg border border-border bg-surface px-4 py-3 text-foreground"
          placeholder="http://localhost:4096"
          placeholderTextColor={placeholderColor}
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TextInput
          className="rounded-lg border border-border bg-surface px-4 py-3 text-foreground"
          placeholder="Username (optional)"
          placeholderTextColor={placeholderColor}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        <TextInput
          className="rounded-lg border border-border bg-surface px-4 py-3 text-foreground"
          placeholder="Password (optional)"
          placeholderTextColor={placeholderColor}
          value={password}
          onChangeText={setPassword}
          secureTextEntry={true}
        />

        {error ? <Text className="text-error text-sm">{error}</Text> : null}

        <Pressable
          className="items-center rounded-lg bg-primary px-4 py-3 active:opacity-80 active:scale-[0.98]"
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
