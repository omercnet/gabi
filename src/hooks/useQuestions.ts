import { useCallback } from "react";
import type { OpencodeClient } from "@/client/types";
import { useQuestionStore } from "@/stores/questionStore";

export function useQuestions(client: OpencodeClient | null, directory: string) {
  const pending = useQuestionStore((s) => s.pending);
  const removeQuestion = useQuestionStore((s) => s.remove);

  const reply = useCallback(
    async (id: string, answers: string[][]) => {
      if (!client) return;
      await client.question.reply({
        requestID: id,
        directory,
        answers,
      });
      removeQuestion(id);
    },
    [client, directory, removeQuestion],
  );

  const reject = useCallback(
    async (id: string) => {
      if (!client) return;
      await client.question.reject({
        requestID: id,
        directory,
      });
      removeQuestion(id);
    },
    [client, directory, removeQuestion],
  );

  return { questions: pending, reply, reject };
}
