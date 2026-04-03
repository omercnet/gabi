import Feather from "@expo/vector-icons/Feather";
import { router } from "expo-router";
import { Pressable, ScrollView, Switch, Text, View } from "react-native";
import { useConnectionStore } from "@/stores/connectionStore";
import { usePreferencesStore } from "@/stores/preferencesStore";

export default function SettingsScreen() {
  const prefs = usePreferencesStore();
  const { baseUrl, reset } = useConnectionStore();

  const handleDisconnect = () => {
    reset();
    router.replace("/setup");
  };

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="mx-auto w-full max-w-lg px-6 py-8">
        <Pressable onPress={() => router.back()} className="mb-6 active:opacity-80">
          <View className="flex-row items-center gap-1">
            <Feather name="arrow-left" size={18} className="text-primary" />
            <Text className="text-primary">Back</Text>
          </View>
        </Pressable>

        <Text className="mb-6 font-bold text-2xl text-foreground">Settings</Text>

        <Text className="mb-3 font-semibold text-muted text-sm">DISPLAY</Text>
        <SettingRow
          label="Show reasoning"
          value={prefs.showReasoning}
          onToggle={prefs.setShowReasoning}
        />
        <SettingRow
          label="Show tool calls"
          value={prefs.showToolCalls}
          onToggle={prefs.setShowToolCalls}
        />
        <SettingRow
          label="Collapse tool groups"
          value={prefs.collapseToolGroups}
          onToggle={prefs.setCollapseToolGroups}
        />
        <SettingRow
          label="Show step markers"
          value={prefs.showStepMarkers}
          onToggle={prefs.setShowStepMarkers}
        />
        <SettingRow
          label="Show file parts"
          value={prefs.showFileParts}
          onToggle={prefs.setShowFileParts}
        />

        <Text className="mt-8 mb-3 font-semibold text-muted text-sm">APPEARANCE</Text>
        <View className="mb-4 flex-row gap-2">
          {(["system", "light", "dark"] as const).map((scheme) => (
            <Pressable
              key={scheme}
              className={`flex-1 items-center rounded-lg py-2 ${prefs.colorScheme === scheme ? "bg-primary" : "bg-surface"} active:opacity-80`}
              onPress={() => prefs.setColorScheme(scheme)}
            >
              <Text
                className={
                  prefs.colorScheme === scheme
                    ? "font-medium text-primary-foreground text-sm"
                    : "text-foreground text-sm"
                }
              >
                {scheme.charAt(0).toUpperCase() + scheme.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text className="mt-8 mb-3 font-semibold text-muted text-sm">CONNECTION</Text>
        <Text className="mb-2 text-foreground text-sm">{baseUrl}</Text>
        <Pressable
          className="mt-2 items-center rounded-lg bg-destructive py-3 active:opacity-80"
          onPress={handleDisconnect}
        >
          <Text className="font-semibold text-destructive-foreground">Disconnect</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function SettingRow({
  label,
  value,
  onToggle,
}: {
  label: string;
  value: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <View className="flex-row items-center justify-between py-3">
      <Text className="text-foreground">{label}</Text>
      <Switch value={value} onValueChange={onToggle} />
    </View>
  );
}
