import { useLocalSearchParams } from "expo-router";
import { KeyboardAvoidingView, Platform, View } from "react-native";
import { ChatInput } from "@/components/chat/ChatInput";
import { MessageList } from "@/components/chat/MessageList";
import { PermissionPromptQueue, QuestionPromptQueue } from "@/components/shared";
import { useClient } from "@/hooks/useClient";
import { useMessages } from "@/hooks/useMessages";
import { usePermissions } from "@/hooks/usePermissions";
import { useQuestions } from "@/hooks/useQuestions";
import { useSendMessage } from "@/hooks/useSendMessage";
import { useSSE } from "@/hooks/useSSE";
import { useProjectStore } from "@/stores/projectStore";

export default function ChatScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const client = useClient();
  const activeProject = useProjectStore((s) => {
    const id = s.activeProjectId;
    return id ? s.projects.find((p) => p.id === id) : undefined;
  });
  const directory = activeProject?.directory ?? "";

  useSSE(client, directory || null);
  const messageViews = useMessages(sessionId ?? null);
  const { send, abort, isStreaming } = useSendMessage(client, sessionId ?? null, directory);
  const { reply: replyPermission } = usePermissions(client, directory);
  const { reply: replyQuestion, reject: rejectQuestion } = useQuestions(client, directory);

  return (
    <View className="flex-1">
      <KeyboardAvoidingView
        className="flex-1 bg-background"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <View className="flex-1">
          <MessageList messages={messageViews} isStreaming={isStreaming} />
        </View>
        <ChatInput onSend={send} onAbort={abort} isStreaming={isStreaming} disabled={!client} />
      </KeyboardAvoidingView>
      <PermissionPromptQueue
        onAllow={(id) => replyPermission(id, true)}
        onDeny={(id) => replyPermission(id, false)}
      />
      <QuestionPromptQueue
        onSubmit={(id, answers) => replyQuestion(id, answers as string[][])}
        onDismiss={(id) => rejectQuestion(id)}
      />
    </View>
  );
}
