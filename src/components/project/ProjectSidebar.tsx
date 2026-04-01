import { router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SessionList } from "@/components/session/SessionList";
import { useClient } from "@/hooks/useClient";
import { useConnectionStore } from "@/stores/connectionStore";
import { useProjectStore } from "@/stores/projectStore";

export function ProjectSidebar() {
  const projects = useProjectStore((s) => s.projects);
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const addProject = useProjectStore((s) => s.addProject);
  const removeProject = useProjectStore((s) => s.removeProject);
  const setActiveProject = useProjectStore((s) => s.setActiveProject);
  const sseStatus = useConnectionStore((s) => s.sseStatus);
  const client = useClient();

  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDir, setNewDir] = useState("");

  const statusColor =
    sseStatus === "connected"
      ? "bg-success"
      : sseStatus === "reconnecting"
        ? "bg-warning"
        : "bg-error";

  const handleAdd = () => {
    if (!newName.trim() || !newDir.trim()) return;
    const project = addProject(newName.trim(), newDir.trim());
    setActiveProject(project.id);
    setShowAdd(false);
    setNewName("");
    setNewDir("");
  };

  return (
    <View className="flex-1 bg-surface">
      <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
        <View className="flex-row items-center gap-2">
          <Text className="text-lg font-bold text-foreground">Gabi</Text>
          <View className={`h-2 w-2 rounded-full ${statusColor}`} />
        </View>
        <Pressable onPress={() => router.push("/settings")}>
          <Text className="text-muted">⚙</Text>
        </Pressable>
      </View>

      <ScrollView className="flex-1">
        {projects.map((project) => (
          <View key={project.id}>
            <Pressable
              className={`px-4 py-3 ${activeProjectId === project.id ? "bg-primary/10" : ""}`}
              onPress={() => setActiveProject(project.id)}
              onLongPress={() => {
                Alert.alert("Remove project?", project.name, [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Remove",
                    style: "destructive",
                    onPress: () => removeProject(project.id),
                  },
                ]);
              }}
            >
              <Text className="font-medium text-foreground">{project.name}</Text>
              <Text className="text-xs text-muted" numberOfLines={1}>
                {project.directory}
              </Text>
            </Pressable>
            {activeProjectId === project.id ? (
              <SessionList client={client} directory={project.directory} />
            ) : null}
          </View>
        ))}
      </ScrollView>

      {showAdd ? (
        <View className="border-t border-border p-4 gap-2">
          <TextInput
            className="rounded-lg border border-border bg-background px-3 py-2 text-foreground text-sm"
            placeholder="Project name"
            placeholderTextColor="#737373"
            value={newName}
            onChangeText={setNewName}
          />
          <TextInput
            className="rounded-lg border border-border bg-background px-3 py-2 text-foreground text-sm"
            placeholder="/path/to/project"
            placeholderTextColor="#737373"
            value={newDir}
            onChangeText={setNewDir}
            autoCapitalize="none"
          />
          <View className="flex-row gap-2">
            <Pressable
              className="flex-1 items-center rounded-lg bg-primary py-2"
              onPress={handleAdd}
            >
              <Text className="text-sm font-semibold text-primary-foreground">Add</Text>
            </Pressable>
            <Pressable
              className="flex-1 items-center rounded-lg bg-surface-hover py-2"
              onPress={() => setShowAdd(false)}
            >
              <Text className="text-sm text-muted">Cancel</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable className="border-t border-border px-4 py-3" onPress={() => setShowAdd(true)}>
          <Text className="text-center text-sm text-primary">+ Add Project</Text>
        </Pressable>
      )}
    </View>
  );
}
