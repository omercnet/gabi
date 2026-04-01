import { act, renderHook, waitFor } from "@testing-library/react-native";
import type { OpencodeClient, Session } from "@/client/types";
import { useSessions } from "@/hooks/useSessions";
import { useSessionStore } from "@/stores/sessionStore";
import { makeSession } from "@/test/factories";
import { resetAllStores } from "@/test/setup";

type SessionApiMock = {
  list: jest.Mock;
  create: jest.Mock;
  delete: jest.Mock;
};

function makeMockClient(sessionOverrides: Partial<SessionApiMock> = {}): OpencodeClient {
  return {
    session: {
      list: jest.fn().mockResolvedValue({ data: [makeSession()] }),
      create: jest.fn().mockResolvedValue({ data: makeSession({ id: "new-1" }) }),
      delete: jest.fn().mockResolvedValue({}),
      ...sessionOverrides,
    },
    permission: {
      reply: jest.fn().mockResolvedValue({}),
    },
    question: {
      reply: jest.fn().mockResolvedValue({}),
      reject: jest.fn().mockResolvedValue({}),
    },
  } as unknown as OpencodeClient;
}

describe("useSessions", () => {
  const directory = "/tmp/project";

  beforeEach(resetAllStores);

  it("returns sessions, loading state, and actions", () => {
    const client = makeMockClient();
    const { result } = renderHook(() => useSessions(client, directory));

    expect(result.current).toEqual(
      expect.objectContaining({
        sessions: expect.any(Array),
        isLoading: expect.any(Boolean),
        createSession: expect.any(Function),
        deleteSession: expect.any(Function),
        selectSession: expect.any(Function),
      }),
    );
  });

  it("fetches sessions on mount via client.session.list({directory})", async () => {
    const list = jest.fn().mockResolvedValue({ data: [makeSession()] });
    const client = makeMockClient({ list });

    renderHook(() => useSessions(client, directory));

    await waitFor(() => {
      expect(list).toHaveBeenCalledWith({ directory });
    });
  });

  it("sets loading=true then loading=false after fetch", async () => {
    let resolveList: ((value: { data: Session[] }) => void) | null = null;
    const list = jest.fn().mockImplementation(
      () =>
        new Promise<{ data: Session[] }>((resolve) => {
          resolveList = resolve;
        }),
    );
    const client = makeMockClient({ list });

    renderHook(() => useSessions(client, directory));

    await waitFor(() => {
      expect(useSessionStore.getState().loadingByDirectory[directory]).toBe(true);
    });

    await act(async () => {
      resolveList?.({ data: [makeSession({ id: "loaded-1" })] });
    });

    await waitFor(() => {
      expect(useSessionStore.getState().loadingByDirectory[directory]).toBe(false);
    });
  });

  it("stores fetched sessions in sessionStore", async () => {
    const fetched = [makeSession({ id: "ses-1" }), makeSession({ id: "ses-2" })];
    const client = makeMockClient({ list: jest.fn().mockResolvedValue({ data: fetched }) });

    renderHook(() => useSessions(client, directory));

    await waitFor(() => {
      expect(useSessionStore.getState().sessionsByDirectory[directory]).toEqual(fetched);
    });
  });

  it("returns empty sessions when directory is null", () => {
    const list = jest.fn().mockResolvedValue({ data: [makeSession()] });
    const client = makeMockClient({ list });
    const { result } = renderHook(() => useSessions(client, null));

    expect(result.current.sessions).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(list).not.toHaveBeenCalled();
  });

  it("returns empty sessions when client is null", () => {
    const { result } = renderHook(() => useSessions(null, directory));

    expect(result.current.sessions).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it("createSession() calls client.session.create({directory, title})", async () => {
    const create = jest.fn().mockResolvedValue({ data: makeSession({ id: "new-2" }) });
    const client = makeMockClient({ create });
    const { result } = renderHook(() => useSessions(client, directory));

    await act(async () => {
      await result.current.createSession("New chat");
    });

    expect(create).toHaveBeenCalledWith({ directory, title: "New chat" });
  });

  it("createSession() returns null when client is null", async () => {
    const { result } = renderHook(() => useSessions(null, directory));

    let created: Session | null = makeSession();
    await act(async () => {
      created = await result.current.createSession("Ignored");
    });

    expect(created).toBeNull();
  });

  it("createSession() returns created session data", async () => {
    const createdSession = makeSession({ id: "created-1", title: "Created" });
    const client = makeMockClient({
      create: jest.fn().mockResolvedValue({ data: createdSession }),
    });
    const { result } = renderHook(() => useSessions(client, directory));

    let created: Session | null = null;
    await act(async () => {
      created = await result.current.createSession("Created");
    });

    expect(created).toEqual(createdSession);
  });

  it("deleteSession() calls client.session.delete and removes from store", async () => {
    const keep = makeSession({ id: "keep-1" });
    const remove = makeSession({ id: "remove-1" });
    const deleteMock = jest.fn().mockResolvedValue({});
    const client = makeMockClient({
      list: jest.fn().mockResolvedValue({ data: [keep, remove] }),
      delete: deleteMock,
    });

    const { result } = renderHook(() => useSessions(client, directory));

    await waitFor(() => {
      expect(useSessionStore.getState().sessionsByDirectory[directory]).toEqual([keep, remove]);
    });

    await act(async () => {
      await result.current.deleteSession(remove.id);
    });

    expect(deleteMock).toHaveBeenCalledWith({ sessionID: remove.id, directory });
    expect(useSessionStore.getState().sessionsByDirectory[directory]).toEqual([keep]);
    expect(useSessionStore.getState().activeSessionId).toBeNull();
  });

  it("deleteSession() does nothing when client is null", async () => {
    const session = makeSession({ id: "stay-1" });
    useSessionStore.setState({ sessionsByDirectory: { [directory]: [session] } });
    const { result } = renderHook(() => useSessions(null, directory));

    await act(async () => {
      await result.current.deleteSession(session.id);
    });

    expect(useSessionStore.getState().sessionsByDirectory[directory]).toEqual([session]);
  });

  it("selectSession() sets activeSessionId in store", () => {
    const client = makeMockClient();
    const { result } = renderHook(() => useSessions(client, directory));

    act(() => {
      result.current.selectSession("active-123");
    });

    expect(useSessionStore.getState().activeSessionId).toBe("active-123");
  });

  it("cancels fetch on unmount (cancelled flag)", async () => {
    let resolveList: ((value: { data: Session[] }) => void) | null = null;
    const list = jest.fn().mockImplementation(
      () =>
        new Promise<{ data: Session[] }>((resolve) => {
          resolveList = resolve;
        }),
    );
    const client = makeMockClient({ list });

    const { unmount } = renderHook(() => useSessions(client, directory));

    await waitFor(() => {
      expect(useSessionStore.getState().loadingByDirectory[directory]).toBe(true);
    });

    unmount();

    await act(async () => {
      resolveList?.({ data: [makeSession({ id: "late-session" })] });
    });

    expect(useSessionStore.getState().sessionsByDirectory[directory]).toBeUndefined();
    expect(useSessionStore.getState().loadingByDirectory[directory]).toBe(true);
  });

  it("re-fetches when directory changes", async () => {
    const list = jest
      .fn()
      .mockResolvedValueOnce({ data: [makeSession({ id: "a-1" })] })
      .mockResolvedValueOnce({ data: [makeSession({ id: "b-1" })] });
    const client = makeMockClient({ list });

    const { rerender } = renderHook(({ dir }: { dir: string }) => useSessions(client, dir), {
      initialProps: { dir: "/project/a" },
    });

    await waitFor(() => {
      expect(list).toHaveBeenCalledWith({ directory: "/project/a" });
    });

    rerender({ dir: "/project/b" });

    await waitFor(() => {
      expect(list).toHaveBeenCalledWith({ directory: "/project/b" });
      expect(list).toHaveBeenCalledTimes(2);
    });
  });
});
