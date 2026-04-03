import Feather from "@expo/vector-icons/Feather";
import { Pressable, Text, View } from "react-native";

interface EmptyStateAction {
  label: string;
  onPress: () => void;
}

interface EmptyStateProps {
  icon?: string;
  iconName?: string;
  title: string;
  subtitle?: string;
  action?: EmptyStateAction;
}

export function EmptyState({ icon, iconName, title, subtitle, action }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center gap-3 p-8">
      {iconName ? (
        <Feather
          name={iconName as keyof typeof Feather.glyphMap}
          size={48}
          className="text-muted"
        />
      ) : icon ? (
        <Text className="text-5xl">{icon}</Text>
      ) : null}
      <Text className="font-semibold text-center text-foreground text-lg">{title}</Text>
      {subtitle ? <Text className="text-center text-muted text-sm">{subtitle}</Text> : null}
      {action ? (
        <Pressable
          className="mt-2 rounded-lg bg-primary px-6 py-2.5 active:opacity-80 active:scale-[0.98]"
          onPress={action.onPress}
        >
          <Text className="font-semibold text-primary-foreground text-sm">{action.label}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
