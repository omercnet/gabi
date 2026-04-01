import { act, renderHook } from "@testing-library/react-native";
import { SSEManager } from "@/client/sse";
import type { OpencodeClient, SSEEvent, SSEStatus } from "@/client/types";
import { useSSE } from "@/hooks/useSSE";
import { useMessageStore } from "@/stores/messageStore";
import { usePermissionStore } from "@/stores/permissionStore";
import { useQuestionStore } from "@/stores/questionStore";
import { useSessionStore } from "@/stores/sessionStore";
import {
  makeAssistantMessage,
  makePermissionRequest,
  makeQuestionRequest,
  makeSession,
  makeTextPart,
  makeToolPart,
} from "@/test/factories";
import { resetAllStores } from "@/test/setup";

type ManagerOptions = {
  client: OpencodeClient;
  directory: string;
  onEvent: (event: SSEEvent) => void;
  onStatusChange: (status: SSEStatus) => void;
};

type MockManagerInstance = {
  start: jest.Mock;
  stop: jest.Mock;
  _opts: ManagerOptions;
};

jest.mock("@/client/sse", () => ({
  SSEManager: jest.fn().mockImplementation((opts: ManagerOptions) => ({
    start: jest.fn(),
    stop: jest.fn(),
    _opts: opts,
  })),
}));

function makeMockClient(): OpencodeClient {
  return {
    event: {
      subscribe: jest.fn(),
    },
  } as unknown as OpencodeClient;
}

function getManagerInstance(index = 0): MockManagerInstance {
  const managerCtor = SSEManager as unknown as jest.Mock;
  return managerCtor.mock.results[index].value as MockManagerInstance;
}

function emit(index: number, event: SSEEvent): void {
  act(() => {
    getManagerInstance(index)._opts.onEvent(event);
  });
}

describe("useSSE", () => {
  const directory = "/tmp/project";

  beforeEach(() => {
    resetAllStores();
    (SSEManager as unknown as jest.Mock).mockClear();
  });

  it("returns void", () => {
    const { result } = renderHook(() => useSSE(makeMockClient(), directory));
    expect(result.current).toBeUndefined();
  });

  it("creates SSEManager on mount", () => {
    const client = makeMockClient();
    renderHook(() => useSSE(client, directory));

    const managerCtor = SSEManager as unknown as jest.Mock;
    expect(managerCtor).toHaveBeenCalledTimes(1);
    expect(managerCtor).toHaveBeenCalledWith(
      expect.objectContaining({ client, directory, onEvent: expect.any(Function) }),
    );
  });

  it("starts manager on mount", () => {
    renderHook(() => useSSE(makeMockClient(), directory));
    expect(getManagerInstance().start).toHaveBeenCalledTimes(1);
  });

  it("stops manager on unmount", () => {
    const { unmount } = renderHook(() => useSSE(makeMockClient(), directory));
    const manager = getManagerInstance();

    unmount();

    expect(manager.stop).toHaveBeenCalledTimes(1);
  });

  it("routes message.part.updated to messageStore.upsertPart", () => {
    renderHook(() => useSSE(makeMockClient(), directory));
    const part = makeTextPart({ id: "part-1", messageID: "msg-1", sessionID: "ses-1" });

    emit(0, {
      type: "message.part.updated",
      properties: { sessionID: "ses-1", part },
    } as unknown as SSEEvent);

    expect(useMessageStore.getState().partsByMessage["msg-1"]["part-1"]).toEqual(part);
  });

  it("routes message.part.removed to messageStore.removePart", () => {
    renderHook(() => useSSE(makeMockClient(), directory));
    const existing = makeToolPart({ id: "part-2", messageID: "msg-2", sessionID: "ses-1" });
    useMessageStore.getState().upsertPart("ses-1", "msg-2", existing);

    emit(0, {
      type: "message.part.removed",
      properties: { sessionID: "ses-1", messageID: "msg-2", partID: "part-2" },
    } as unknown as SSEEvent);

    expect(useMessageStore.getState().partsByMessage["msg-2"]["part-2"]).toBeUndefined();
  });

  it("routes message.updated to messageStore.upsertMessage", () => {
    renderHook(() => useSSE(makeMockClient(), directory));
    const message = makeAssistantMessage({ id: "msg-3", sessionID: "ses-3" });

    emit(0, {
      type: "message.updated",
      properties: { sessionID: "ses-3", info: message },
    } as unknown as SSEEvent);

    expect(useMessageStore.getState().messagesBySession["ses-3"]).toEqual([message]);
  });

  it("routes message.removed to messageStore.removeMessage", () => {
    renderHook(() => useSSE(makeMockClient(), directory));
    const keep = makeAssistantMessage({ id: "keep-1", sessionID: "ses-4" });
    const remove = makeAssistantMessage({ id: "remove-1", sessionID: "ses-4" });
    useMessageStore.getState().setMessages("ses-4", [keep, remove]);

    emit(0, {
      type: "message.removed",
      properties: { sessionID: "ses-4", messageID: "remove-1" },
    } as unknown as SSEEvent);

    expect(useMessageStore.getState().messagesBySession["ses-4"]).toEqual([keep]);
  });

  it("routes session.created to sessionStore.upsertSession", () => {
    renderHook(() => useSSE(makeMockClient(), directory));
    const session = makeSession({ id: "ses-created" });

    emit(0, {
      type: "session.created",
      properties: { info: session },
    } as unknown as SSEEvent);

    expect(useSessionStore.getState().sessionsByDirectory[directory]).toEqual([session]);
  });

  it("routes session.updated to sessionStore.upsertSession", () => {
    renderHook(() => useSSE(makeMockClient(), directory));
    const initial = makeSession({ id: "ses-updated", title: "Old" });
    useSessionStore.getState().setSessions(directory, [initial]);
    const updated = { ...initial, title: "New" };

    emit(0, {
      type: "session.updated",
      properties: { info: updated },
    } as unknown as SSEEvent);

    expect(useSessionStore.getState().sessionsByDirectory[directory][0].title).toBe("New");
  });

  it("routes session.deleted to sessionStore.removeSession", () => {
    renderHook(() => useSSE(makeMockClient(), directory));
    const keep = makeSession({ id: "keep-session" });
    const remove = makeSession({ id: "remove-session" });
    useSessionStore.getState().setSessions(directory, [keep, remove]);

    emit(0, {
      type: "session.deleted",
      properties: { info: { id: "remove-session" } },
    } as unknown as SSEEvent);

    expect(useSessionStore.getState().sessionsByDirectory[directory]).toEqual([keep]);
  });

  it("routes session.status busy to setStreaming(sessionId)", () => {
    renderHook(() => useSSE(makeMockClient(), directory));

    emit(0, {
      type: "session.status",
      properties: { sessionID: "stream-1", status: { type: "busy" } },
    } as unknown as SSEEvent);

    expect(useMessageStore.getState().streamingSessionId).toBe("stream-1");
  });

  it("routes session.status idle to setStreaming(null)", () => {
    renderHook(() => useSSE(makeMockClient(), directory));
    useMessageStore.getState().setStreaming("stream-2");

    emit(0, {
      type: "session.status",
      properties: { sessionID: "stream-2", status: { type: "idle" } },
    } as unknown as SSEEvent);

    expect(useMessageStore.getState().streamingSessionId).toBeNull();
  });

  it("routes session.idle to setStreaming(null)", () => {
    renderHook(() => useSSE(makeMockClient(), directory));
    useMessageStore.getState().setStreaming("stream-3");

    emit(0, {
      type: "session.idle",
      properties: { sessionID: "stream-3" },
    } as unknown as SSEEvent);

    expect(useMessageStore.getState().streamingSessionId).toBeNull();
  });

  it("routes permission.asked to permissionStore.upsert", () => {
    renderHook(() => useSSE(makeMockClient(), directory));
    const request = makePermissionRequest({ id: "perm-1" });

    emit(0, {
      type: "permission.asked",
      properties: request,
    } as unknown as SSEEvent);

    expect(usePermissionStore.getState().pending).toEqual([request]);
  });

  it("routes permission.replied to permissionStore.remove", () => {
    renderHook(() => useSSE(makeMockClient(), directory));
    const request = makePermissionRequest({ id: "perm-2" });
    usePermissionStore.getState().upsert(request);

    emit(0, {
      type: "permission.replied",
      properties: { requestID: "perm-2" },
    } as unknown as SSEEvent);

    expect(usePermissionStore.getState().pending).toEqual([]);
  });

  it("routes question.asked to questionStore.upsert", () => {
    renderHook(() => useSSE(makeMockClient(), directory));
    const question = makeQuestionRequest({ id: "q-1" });

    emit(0, {
      type: "question.asked",
      properties: question,
    } as unknown as SSEEvent);

    expect(useQuestionStore.getState().pending).toEqual([question]);
  });

  it("handles null client by not creating manager", () => {
    renderHook(() => useSSE(null, directory));
    expect(SSEManager as unknown as jest.Mock).not.toHaveBeenCalled();
  });

  it("handles null directory by not creating manager", () => {
    renderHook(() => useSSE(makeMockClient(), null));
    expect(SSEManager as unknown as jest.Mock).not.toHaveBeenCalled();
  });

  it("handles client change by stopping old manager and starting new manager", () => {
    const firstClient = makeMockClient();
    const secondClient = makeMockClient();

    const { rerender } = renderHook(
      ({ client }: { client: OpencodeClient }) => useSSE(client, directory),
      {
        initialProps: { client: firstClient },
      },
    );

    const firstManager = getManagerInstance(0);

    rerender({ client: secondClient });

    const secondManager = getManagerInstance(1);
    expect(firstManager.stop).toHaveBeenCalledTimes(1);
    expect(secondManager.start).toHaveBeenCalledTimes(1);
  });
});
