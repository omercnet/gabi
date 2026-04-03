import Feather from "@expo/vector-icons/Feather";
import { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import type { QuestionRequest } from "@/client/types"; // QuestionAnswer = string[]
import { usePlaceholderColor } from "@/lib/colors";
import { useQuestionStore } from "@/stores/questionStore";

interface QuestionPromptProps {
  request: QuestionRequest;
  onSubmit: (answers: string[][]) => void;
  onDismiss: () => void;
}

export function QuestionPrompt({ request, onSubmit, onDismiss }: QuestionPromptProps) {
  const placeholderColor = usePlaceholderColor();
  const firstQuestion = request.questions[0];
  // Reset local state when the request changes (queue advances to next item)
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [freeText, setFreeText] = useState("");

  // Reset when request.id changes (new question in queue)
  // biome-ignore lint/correctness/useExhaustiveDependencies: setters from useState are stable
  useEffect(() => {
    setSelectedOptions([]);
    setFreeText("");
  }, [request.id]);

  if (!firstQuestion) return null;

  const hasOptions = firstQuestion.options && firstQuestion.options.length > 0;
  const isMultiple = firstQuestion.multiple ?? false;

  const canSubmit = hasOptions ? selectedOptions.length > 0 : freeText.trim().length > 0;

  const handleOptionToggle = (label: string) => {
    if (isMultiple) {
      setSelectedOptions((prev) =>
        prev.includes(label) ? prev.filter((o) => o !== label) : [...prev, label],
      );
    } else {
      setSelectedOptions([label]);
    }
  };

  const handleSubmit = () => {
    if (hasOptions) {
      onSubmit([selectedOptions]);
    } else {
      onSubmit([[freeText.trim()]]);
    }
  };

  return (
    <Modal
      visible={true}
      animationType="slide"
      transparent={true}
      statusBarTranslucent={true}
      onRequestClose={onDismiss}
    >
      <View className="flex-1 justify-end">
        <View className="rounded-t-3xl bg-surface p-6 shadow-xl">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="font-bold text-foreground text-xl">{firstQuestion.header}</Text>
            <Pressable onPress={onDismiss} hitSlop={8} className="active:opacity-80">
              <Feather name="x" size={20} className="text-muted" />
            </Pressable>
          </View>

          <Text className="mb-4 text-foreground text-sm">{firstQuestion.question}</Text>

          {hasOptions ? (
            <ScrollView className="mb-4 max-h-64" showsVerticalScrollIndicator={false}>
              <View className="gap-2">
                {firstQuestion.options.map((option) => {
                  const isSelected = selectedOptions.includes(option.label);
                  return (
                    <Pressable
                      key={option.label}
                      className={`rounded-xl border p-3 ${
                        isSelected ? "border-primary bg-primary/10" : "border-border bg-background"
                      } active:opacity-80`}
                      onPress={() => handleOptionToggle(option.label)}
                    >
                      <Text
                        className={`font-medium text-sm ${isSelected ? "text-primary" : "text-foreground"}`}
                      >
                        {option.label}
                      </Text>
                      {option.description ? (
                        <Text className="mt-0.5 text-muted text-xs">{option.description}</Text>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          ) : (
            <TextInput
              className="mb-4 rounded-xl border border-border bg-background px-4 py-3 text-foreground text-sm"
              placeholder="Type your answer..."
              placeholderTextColor={placeholderColor}
              value={freeText}
              onChangeText={setFreeText}
              multiline={true}
              numberOfLines={3}
            />
          )}

          <Pressable
            className={`items-center rounded-xl py-3 ${canSubmit ? "bg-primary" : "bg-surface-hover"} active:opacity-80 active:scale-[0.98]`}
            onPress={handleSubmit}
            disabled={!canSubmit}
          >
            <Text
              className={`font-semibold text-sm ${canSubmit ? "text-primary-foreground" : "text-muted"}`}
            >
              Submit
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

interface QuestionPromptQueueProps {
  onSubmit?: (id: string, answers: string[][]) => void;
  onDismiss?: (id: string) => void;
}

export function QuestionPromptQueue({ onSubmit, onDismiss }: QuestionPromptQueueProps = {}) {
  const pending = useQuestionStore((s) => s.pending);
  const remove = useQuestionStore((s) => s.remove);

  const first = pending[0];
  if (!first) return null;

  return (
    <QuestionPrompt
      request={first}
      onSubmit={(answers) => {
        onSubmit ? onSubmit(first.id, answers) : remove(first.id);
      }}
      onDismiss={() => {
        onDismiss ? onDismiss(first.id) : remove(first.id);
      }}
    />
  );
}
