import { Pressable, Text, View } from "react-native";

interface EmptyStateAction {
  label: string;
  onPress: () => void;
}

interface EmptyStateProps {
  icon: string;
  title: string;
  subtitle?: string;
  action?: EmptyStateAction;
}

export function EmptyState({ icon, title, subtitle, action }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center gap-3 p-8">
      <Text className="text-5xl">{icon}</Text>
      <Text className="font-semibold text-center text-foreground text-lg dark:text-foreground">
        {title}
      </Text>
      {subtitle ? (
        <Text className="text-center text-muted text-sm dark:text-muted">{subtitle}</Text>
      ) : null}
      {action ? (
        <Pressable
          className="mt-2 rounded-lg bg-primary px-6 py-2.5 dark:bg-primary"
          onPress={action.onPress}
        >
          <Text className="font-semibold text-primary-foreground text-sm dark:text-primary-foreground">
            {action.label}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
