import BottomSheet, { BottomSheetTextInput, BottomSheetView } from "@gorhom/bottom-sheet";
import { useRef, useState } from "react";
import { Pressable, Text } from "react-native";
import { useProjectStore } from "@/stores/projectStore";

interface AddProjectSheetProps {
  onClose: () => void;
}

export function AddProjectSheet({ onClose }: AddProjectSheetProps) {
  const [newName, setNewName] = useState("");
  const [newDir, setNewDir] = useState("");
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = ["50%"];

  const handleAdd = () => {
    if (!(newName.trim() && newDir.trim())) return;
    useProjectStore.getState().addProject(newName.trim(), newDir.trim());
    setNewName("");
    setNewDir("");
    onClose();
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      onClose={onClose}
      enablePanDownToClose={true}
      index={0}
    >
      <BottomSheetView className="flex-1 gap-4 px-4 py-2">
        <Text className="font-bold text-foreground text-lg dark:text-foreground">Add Project</Text>

        <BottomSheetTextInput
          className="rounded-xl border border-border bg-background px-4 py-3 text-foreground text-sm dark:border-border dark:bg-background dark:text-foreground"
          placeholder="Project name"
          placeholderTextColor="#737373"
          value={newName}
          onChangeText={setNewName}
        />

        <BottomSheetTextInput
          className="rounded-xl border border-border bg-background px-4 py-3 text-foreground text-sm dark:border-border dark:bg-background dark:text-foreground"
          placeholder="/path/to/project"
          placeholderTextColor="#737373"
          value={newDir}
          onChangeText={setNewDir}
          autoCapitalize="none"
        />

        <Pressable
          className={`items-center rounded-xl py-3 ${newName.trim() && newDir.trim() ? "bg-primary dark:bg-primary" : "bg-surface-hover dark:bg-surface-hover"}`}
          onPress={handleAdd}
          disabled={!(newName.trim() && newDir.trim())}
        >
          <Text
            className={`font-semibold text-sm ${newName.trim() && newDir.trim() ? "text-primary-foreground dark:text-primary-foreground" : "text-muted dark:text-muted"}`}
          >
            Add Project
          </Text>
        </Pressable>

        <Pressable
          className="items-center rounded-xl bg-surface-hover py-3 dark:bg-surface-hover"
          onPress={onClose}
        >
          <Text className="text-muted text-sm dark:text-muted">Cancel</Text>
        </Pressable>
      </BottomSheetView>
    </BottomSheet>
  );
}
