import { act, renderHook } from "@testing-library/react-native";
import type { OpencodeClient } from "@/client/types";
import { useSendMessage } from "@/hooks/useSendMessage";
import { useMessageStore } from "@/stores/messageStore";
import { resetAllStores } from "@/test/setup";

const mockClient = {
  session: {
    prompt: jest.fn().mockResolvedValue({}),
    abort: jest.fn().mockResolvedValue({}),
  },
};

describe("useSendMessage", () => {
  const sessionId = "ses-1";
  const directory = "/tmp/project";

  beforeEach(() => {
    resetAllStores();
    mockClient.session.prompt.mockClear();
    mockClient.session.abort.mockClear();
  });

  it("returns send, abort, isStreaming", () => {
    const { result } = renderHook(() =>
      useSendMessage(mockClient as unknown as OpencodeClient, sessionId, directory),
    );

    expect(typeof result.current.send).toBe("function");
    expect(typeof result.current.abort).toBe("function");
    expect(result.current.isStreaming).toBe(false);
  });

  it("send() calls client.session.prompt with correct args", async () => {
    const { result } = renderHook(() =>
      useSendMessage(mockClient as unknown as OpencodeClient, sessionId, directory),
    );

    await act(async () => {
      await result.current.send("hello world");
    });

    expect(mockClient.session.prompt).toHaveBeenCalledWith({
      sessionID: sessionId,
      directory,
      parts: [{ type: "text", text: "hello world" }],
    });
  });

  it("send() does nothing when client is null", async () => {
    const { result } = renderHook(() => useSendMessage(null, sessionId, directory));

    await act(async () => {
      await result.current.send("hello");
    });

    expect(mockClient.session.prompt).not.toHaveBeenCalled();
  });

  it("send() does nothing when sessionId is null", async () => {
    const { result } = renderHook(() =>
      useSendMessage(mockClient as unknown as OpencodeClient, null, directory),
    );

    await act(async () => {
      await result.current.send("hello");
    });

    expect(mockClient.session.prompt).not.toHaveBeenCalled();
  });

  it("send() does nothing when text is empty", async () => {
    const { result } = renderHook(() =>
      useSendMessage(mockClient as unknown as OpencodeClient, sessionId, directory),
    );

    await act(async () => {
      await result.current.send("");
    });

    expect(mockClient.session.prompt).not.toHaveBeenCalled();
  });

  it("send() does nothing when text is whitespace", async () => {
    const { result } = renderHook(() =>
      useSendMessage(mockClient as unknown as OpencodeClient, sessionId, directory),
    );

    await act(async () => {
      await result.current.send("   \n\t  ");
    });

    expect(mockClient.session.prompt).not.toHaveBeenCalled();
  });

  it("send() resolves without error before/while sending", async () => {
    const { result } = renderHook(() =>
      useSendMessage(mockClient as unknown as OpencodeClient, sessionId, directory),
    );

    await expect(result.current.send("message")).resolves.toBeUndefined();
  });

  it("abort() calls client.session.abort with {sessionID, directory}", async () => {
    const { result } = renderHook(() =>
      useSendMessage(mockClient as unknown as OpencodeClient, sessionId, directory),
    );

    await act(async () => {
      await result.current.abort();
    });

    expect(mockClient.session.abort).toHaveBeenCalledWith({
      sessionID: sessionId,
      directory,
    });
  });

  it("abort() does nothing when client is null", async () => {
    const { result } = renderHook(() => useSendMessage(null, sessionId, directory));

    await act(async () => {
      await result.current.abort();
    });

    expect(mockClient.session.abort).not.toHaveBeenCalled();
  });

  it("abort() does nothing when sessionId is null", async () => {
    const { result } = renderHook(() =>
      useSendMessage(mockClient as unknown as OpencodeClient, null, directory),
    );

    await act(async () => {
      await result.current.abort();
    });

    expect(mockClient.session.abort).not.toHaveBeenCalled();
  });

  it("isStreaming is true when streamingSessionId matches sessionId", () => {
    useMessageStore.setState({ streamingSessionId: sessionId });

    const { result } = renderHook(() =>
      useSendMessage(mockClient as unknown as OpencodeClient, sessionId, directory),
    );

    expect(result.current.isStreaming).toBe(true);
  });

  it("isStreaming is false when streamingSessionId is different", () => {
    useMessageStore.setState({ streamingSessionId: "ses-other" });

    const { result } = renderHook(() =>
      useSendMessage(mockClient as unknown as OpencodeClient, sessionId, directory),
    );

    expect(result.current.isStreaming).toBe(false);
  });

  it("isStreaming is false when streamingSessionId is null", () => {
    useMessageStore.setState({ streamingSessionId: null });

    const { result } = renderHook(() =>
      useSendMessage(mockClient as unknown as OpencodeClient, sessionId, directory),
    );

    expect(result.current.isStreaming).toBe(false);
  });
});
