import { act, renderHook, waitFor } from "@testing-library/react-native";
import type { OpencodeClient } from "@/client/types";
import { useQuestions } from "@/hooks/useQuestions";
import { useQuestionStore } from "@/stores/questionStore";
import { makeQuestionRequest } from "@/test/factories";
import { resetAllStores } from "@/test/setup";

function makeMockClient(
  replyMock: jest.Mock = jest.fn().mockResolvedValue({}),
  rejectMock: jest.Mock = jest.fn().mockResolvedValue({}),
): OpencodeClient {
  return {
    session: {
      list: jest.fn().mockResolvedValue({ data: [] }),
      create: jest.fn().mockResolvedValue({ data: null }),
      delete: jest.fn().mockResolvedValue({}),
    },
    permission: {
      reply: jest.fn().mockResolvedValue({}),
    },
    question: {
      reply: replyMock,
      reject: rejectMock,
    },
  } as unknown as OpencodeClient;
}

describe("useQuestions", () => {
  const directory = "/tmp/project";

  beforeEach(resetAllStores);

  it("returns questions, reply, and reject", () => {
    const client = makeMockClient();
    const { result } = renderHook(() => useQuestions(client, directory));

    expect(result.current).toEqual(
      expect.objectContaining({
        questions: expect.any(Array),
        reply: expect.any(Function),
        reject: expect.any(Function),
      }),
    );
  });

  it("questions reflects questionStore.pending", () => {
    const pending = [makeQuestionRequest({ id: "q-1" })];
    useQuestionStore.setState({ pending });
    const client = makeMockClient();

    const { result } = renderHook(() => useQuestions(client, directory));

    expect(result.current.questions).toEqual(pending);
  });

  it("reply(id, answers) calls client.question.reply with answers", async () => {
    const replyMock = jest.fn().mockResolvedValue({});
    const client = makeMockClient(replyMock);
    useQuestionStore.setState({ pending: [makeQuestionRequest({ id: "q-2" })] });
    const { result } = renderHook(() => useQuestions(client, directory));
    const answers = [["A"]];

    await act(async () => {
      await result.current.reply("q-2", answers);
    });

    expect(replyMock).toHaveBeenCalledWith({
      requestID: "q-2",
      directory,
      answers,
    });
  });

  it("reply removes question from store", async () => {
    const replyMock = jest.fn().mockResolvedValue({});
    const question = makeQuestionRequest({ id: "q-3" });
    useQuestionStore.setState({ pending: [question] });
    const client = makeMockClient(replyMock);
    const { result } = renderHook(() => useQuestions(client, directory));

    await act(async () => {
      await result.current.reply(question.id, [["Option"]]);
    });

    await waitFor(() => {
      expect(useQuestionStore.getState().pending).toEqual([]);
    });
  });

  it("reply does nothing when client is null", async () => {
    const question = makeQuestionRequest({ id: "q-4" });
    useQuestionStore.setState({ pending: [question] });
    const { result } = renderHook(() => useQuestions(null, directory));

    await act(async () => {
      await result.current.reply(question.id, [["Ignored"]]);
    });

    expect(useQuestionStore.getState().pending).toEqual([question]);
  });

  it("reject(id) calls client.question.reject", async () => {
    const rejectMock = jest.fn().mockResolvedValue({});
    const question = makeQuestionRequest({ id: "q-5" });
    useQuestionStore.setState({ pending: [question] });
    const client = makeMockClient(jest.fn().mockResolvedValue({}), rejectMock);
    const { result } = renderHook(() => useQuestions(client, directory));

    await act(async () => {
      await result.current.reject(question.id);
    });

    expect(rejectMock).toHaveBeenCalledWith({
      requestID: question.id,
      directory,
    });
  });

  it("reject removes question from store", async () => {
    const question = makeQuestionRequest({ id: "q-6" });
    useQuestionStore.setState({ pending: [question] });
    const client = makeMockClient();
    const { result } = renderHook(() => useQuestions(client, directory));

    await act(async () => {
      await result.current.reject(question.id);
    });

    await waitFor(() => {
      expect(useQuestionStore.getState().pending).toEqual([]);
    });
  });

  it("reject does nothing when client is null", async () => {
    const question = makeQuestionRequest({ id: "q-7" });
    useQuestionStore.setState({ pending: [question] });
    const { result } = renderHook(() => useQuestions(null, directory));

    await act(async () => {
      await result.current.reject(question.id);
    });

    expect(useQuestionStore.getState().pending).toEqual([question]);
  });
});
