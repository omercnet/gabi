import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import type { PermissionRequest } from "@/client/types";
import { usePermissionStore } from "@/stores/permissionStore";

interface PermissionPromptProps {
  request: PermissionRequest;
  onAllow: () => void;
  onDeny: () => void;
}

export function PermissionPrompt({ request, onAllow, onDeny }: PermissionPromptProps) {
  const argsPreview = request.metadata ? JSON.stringify(request.metadata, null, 2) : null;

  return (
    <Modal
      visible={true}
      animationType="fade"
      transparent={true}
      statusBarTranslucent={true}
      onRequestClose={onDeny}
    >
      <View className="flex-1 items-center justify-center bg-black/60 px-6">
        <View className="w-full max-w-sm rounded-2xl bg-surface p-5 shadow-xl">
          <Text className="mb-1 font-bold text-base text-foreground">Permission Request</Text>
          <Text className="mb-3 font-semibold text-foreground text-sm">{request.permission}</Text>

          {request.patterns.length > 0 ? (
            <View className="mb-3">
              <Text className="mb-1 text-muted text-xs">Patterns:</Text>
              {request.patterns.map((p, i) => (
                <Text
                  key={i}
                  className="rounded bg-surface-hover px-2 py-0.5 font-mono text-foreground text-xs"
                >
                  {p}
                </Text>
              ))}
            </View>
          ) : null}

          {argsPreview && argsPreview !== "{}" ? (
            <View className="mb-4">
              <Text className="mb-1 text-muted text-xs">Details:</Text>
              <ScrollView
                className="max-h-[200px] rounded-lg bg-background p-2"
                nestedScrollEnabled={true}
              >
                <Text className="font-mono text-foreground text-xs">{argsPreview}</Text>
              </ScrollView>
            </View>
          ) : null}

          <View className="flex-row gap-3">
            <Pressable
              className="flex-1 items-center rounded-xl bg-error py-2.5 active:opacity-80"
              onPress={onDeny}
            >
              <Text className="font-semibold text-sm text-white">Deny</Text>
            </Pressable>
            <Pressable
              className="flex-1 items-center rounded-xl bg-success py-2.5 active:opacity-80"
              onPress={onAllow}
            >
              <Text className="font-semibold text-sm text-white">Allow</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

interface PermissionPromptQueueProps {
  onAllow?: (id: string) => void;
  onDeny?: (id: string) => void;
}

export function PermissionPromptQueue({ onAllow, onDeny }: PermissionPromptQueueProps = {}) {
  const pending = usePermissionStore((s) => s.pending);
  const remove = usePermissionStore((s) => s.remove);

  const first = pending[0];
  if (!first) return null;

  return (
    <PermissionPrompt
      request={first}
      onAllow={() => {
        onAllow ? onAllow(first.id) : remove(first.id);
      }}
      onDeny={() => {
        onDeny ? onDeny(first.id) : remove(first.id);
      }}
    />
  );
}
