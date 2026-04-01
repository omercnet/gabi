import type { OpencodeClient } from "@/client/types";
import { useQuestionStore } from "@/stores/questionStore";
import { makeQuestionRequest } from "@/test/factories";
import { resetAllStores } from "@/test/setup";

async function replyQuestion(
  client: OpencodeClient | null,
  directory: string,
  id: string,
  answers: string[][],
): Promise<void> {
  if (!client) return;
  await client.question.reply({ requestID: id, directory, answers });
  useQuestionStore.getState().remove(id);
}

async function rejectQuestion(
  client: OpencodeClient | null,
  directory: string,
  id: string,
): Promise<void> {
  if (!client) return;
  await client.question.reject({ requestID: id, directory });
  useQuestionStore.getState().remove(id);
}

describe("useQuestions store paths", () => {
  beforeEach(resetAllStores);

  it("upsert adds pending question", () => {
    useQuestionStore.getState().upsert(makeQuestionRequest({ id: "q1" }));
    expect(useQuestionStore.getState().pending).toHaveLength(1);
  });

  it("upsert updates existing question by id", () => {
    const question = makeQuestionRequest({ id: "q1", sessionID: "old" });
    useQuestionStore.getState().upsert(question);
    useQuestionStore.getState().upsert({ ...question, sessionID: "new" });

    expect(useQuestionStore.getState().pending).toHaveLength(1);
    expect(useQuestionStore.getState().pending[0]?.sessionID).toBe("new");
  });

  it("remove deletes pending question by id", () => {
    useQuestionStore.getState().upsert(makeQuestionRequest({ id: "q1" }));
    useQuestionStore.getState().remove("q1");

    expect(useQuestionStore.getState().pending).toHaveLength(0);
  });

  it("clear empties pending question list", () => {
    useQuestionStore.getState().upsert(makeQuestionRequest({ id: "q1" }));
    useQuestionStore.getState().upsert(makeQuestionRequest({ id: "q2" }));
    useQuestionStore.getState().clear();

    expect(useQuestionStore.getState().pending).toHaveLength(0);
  });

  it("reply sends answers and removes question", async () => {
    useQuestionStore.getState().upsert(makeQuestionRequest({ id: "q1" }));
    const reply = jest.fn().mockResolvedValue({});
    const client = { question: { reply, reject: jest.fn() } } as unknown as OpencodeClient;

    await replyQuestion(client, "/project", "q1", [["A"], ["B"]]);

    expect(reply).toHaveBeenCalledWith({
      requestID: "q1",
      directory: "/project",
      answers: [["A"], ["B"]],
    });
    expect(useQuestionStore.getState().pending).toHaveLength(0);
  });

  it("reject sends request and removes question", async () => {
    useQuestionStore.getState().upsert(makeQuestionRequest({ id: "q1" }));
    const reject = jest.fn().mockResolvedValue({});
    const client = { question: { reply: jest.fn(), reject } } as unknown as OpencodeClient;

    await rejectQuestion(client, "/project", "q1");

    expect(reject).toHaveBeenCalledWith({ requestID: "q1", directory: "/project" });
    expect(useQuestionStore.getState().pending).toHaveLength(0);
  });

  it("reply is a no-op when client is null", async () => {
    useQuestionStore.getState().upsert(makeQuestionRequest({ id: "q1" }));

    await replyQuestion(null, "/project", "q1", [["A"]]);

    expect(useQuestionStore.getState().pending).toHaveLength(1);
  });

  it("reject is a no-op when client is null", async () => {
    useQuestionStore.getState().upsert(makeQuestionRequest({ id: "q1" }));

    await rejectQuestion(null, "/project", "q1");

    expect(useQuestionStore.getState().pending).toHaveLength(1);
  });
});
