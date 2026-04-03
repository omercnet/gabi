/**
 * Tests useSessions AS A REAL HOOK with renderHook.
 *
 * The existing useSessions.test.ts tests the store logic directly.
 * This file tests the ACTUAL HOOK — useEffect firing, cancellation,
 * reactive updates, and loading state.
 *
 * Bugs these tests would have caught:
 * - useSessions not re-fetching when client changes from null → real client
 * - useSessions ignoring stale fetch results after unmount
 * - Loading state not being set/cleared correctly
 */

import { act, renderHook, waitFor } from "@testing-library/react-native";
import { useSessions } from "@/hooks/useSessions";
import { useSessionStore } from "@/stores/sessionStore";
import { makeSession } from "@/test/factories";
import { resetAllStores } from "@/test/setup";

function makeMockClient(sessions: ReturnType<typeof makeSession>[] = [], delay = 0) {
  return {
    session: {
      list: jest.fn(() =>
        delay > 0
          ? new Promise((r) => setTimeout(() => r({ data: sessions }), delay))
          : Promise.resolve({ data: sessions }),
      ),
      create: jest.fn(() => Promise.resolve({ data: makeSession({ id: "new-ses" }) })),
      delete: jest.fn(() => Promise.resolve({ data: {} })),
    },
  } as unknown as Parameters<typeof useSessions>[0];
}

const DIR = "/test/project";

describe("useSessions (real hook)", () => {
  beforeEach(resetAllStores);

  it("returns empty sessions and not loading when client is null", () => {
    const { result } = renderHook(() => useSessions(null, DIR));
    expect(result.current.sessions).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it("returns empty sessions when directory is null", () => {
    const client = makeMockClient([makeSession()]);
    const { result } = renderHook(() => useSessions(client, null));
    expect(result.current.sessions).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it("fetches sessions on mount when client and directory are provided", async () => {
    const session = makeSession({ id: "fetched-1" });
    const client = makeMockClient([session]);

    const { result } = renderHook(() => useSessions(client, DIR));

    await waitFor(() => {
      expect(result.current.sessions).toHaveLength(1);
    });

    expect(result.current.sessions[0]?.id).toBe("fetched-1");
    expect(client!.session.list).toHaveBeenCalledWith({ directory: DIR });
  });

  it("sets isLoading=true during fetch, false after", async () => {
    const client = makeMockClient([makeSession()], 50); // 50ms delay

    const { result } = renderHook(() => useSessions(client, DIR));

    // During fetch
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it("does NOT call session.list when client is null", () => {
    const client = makeMockClient([makeSession()]);
    renderHook(() => useSessions(null, DIR));
    // Give it time to potentially fire
    expect(client!.session.list).not.toHaveBeenCalled();
  });

  it("does NOT call session.list when directory is null", () => {
    const client = makeMockClient([makeSession()]);
    renderHook(() => useSessions(client, null));
    expect(client!.session.list).not.toHaveBeenCalled();
  });

  it("re-fetches when directory changes", async () => {
    const session1 = makeSession({ id: "dir1-ses" });
    const session2 = makeSession({ id: "dir2-ses" });

    const clientRef = {
      current: {
        session: {
          list: jest.fn((args: { directory: string }) =>
            Promise.resolve({
              data: args.directory === "/dir1" ? [session1] : [session2],
            }),
          ),
          create: jest.fn(() => Promise.resolve({ data: makeSession() })),
          delete: jest.fn(() => Promise.resolve({ data: {} })),
        },
      } as unknown as Parameters<typeof useSessions>[0],
    };
    const dirRef = { current: "/dir1" };

    const { result, rerender } = renderHook(() => useSessions(clientRef.current, dirRef.current));

    await waitFor(() => expect(result.current.sessions[0]?.id).toBe("dir1-ses"));

    dirRef.current = "/dir2";
    rerender({});

    await waitFor(() => expect(result.current.sessions[0]?.id).toBe("dir2-ses"));
  });

  it("re-fetches when client changes from null to real", async () => {
    const session = makeSession({ id: "appeared" });
    const clientRef: { current: Parameters<typeof useSessions>[0] } = { current: null };
    const { result, rerender } = renderHook(() => useSessions(clientRef.current, DIR));

    expect(result.current.sessions).toHaveLength(0);

    clientRef.current = makeMockClient([session]);
    rerender({});

    await waitFor(() => expect(result.current.sessions).toHaveLength(1));
    expect(result.current.sessions[0]?.id).toBe("appeared");
  });

  it("ignores stale fetch results after unmount (no state update after unmount)", async () => {
    let resolveList!: (v: unknown) => void;
    const pending = new Promise((r) => (resolveList = r));
    const client = {
      session: {
        list: jest.fn(() => pending),
        create: jest.fn(),
        delete: jest.fn(),
      },
    } as unknown as Parameters<typeof useSessions>[0];

    const { unmount } = renderHook(() => useSessions(client, DIR));

    // Unmount before the fetch resolves
    unmount();

    // Resolve after unmount — should not update store
    act(() => {
      resolveList({ data: [makeSession({ id: "stale" })] });
    });

    // Store should be empty — stale result was discarded
    expect(useSessionStore.getState().sessionsByDirectory[DIR]).toBeUndefined();
  });

  it("createSession calls client.session.create and returns session", async () => {
    const newSession = makeSession({ id: "created" });
    const client = {
      session: {
        list: jest.fn(() => Promise.resolve({ data: [] })),
        create: jest.fn(() => Promise.resolve({ data: newSession })),
        delete: jest.fn(),
      },
    } as unknown as Parameters<typeof useSessions>[0];

    const { result } = renderHook(() => useSessions(client, DIR));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let created: unknown;
    await act(async () => {
      created = await result.current.createSession("My title");
    });

    expect(client!.session.create).toHaveBeenCalledWith({ directory: DIR, title: "My title" });
    expect((created as { id: string })?.id).toBe("created");
  });

  it("createSession returns null when client is null", async () => {
    const { result } = renderHook(() => useSessions(null, DIR));
    let created: unknown;
    await act(async () => {
      created = await result.current.createSession();
    });
    expect(created).toBeNull();
  });

  it("deleteSession calls client.session.delete and removes from store", async () => {
    const session = makeSession({ id: "to-delete" });
    const client = makeMockClient([session]);

    const { result } = renderHook(() => useSessions(client, DIR));
    await waitFor(() => expect(result.current.sessions).toHaveLength(1));

    act(() => {
      useSessionStore.getState().setSessions(DIR, [session]);
    });

    await act(async () => {
      await result.current.deleteSession("to-delete");
    });

    expect(client!.session.delete).toHaveBeenCalledWith({
      sessionID: "to-delete",
      directory: DIR,
    });
    expect(useSessionStore.getState().sessionsByDirectory[DIR]).toHaveLength(0);
  });

  it("selectSession sets activeSessionId in store", () => {
    const client = makeMockClient();
    const { result } = renderHook(() => useSessions(client, DIR));

    act(() => {
      result.current.selectSession("ses-xyz");
    });

    expect(useSessionStore.getState().activeSessionId).toBe("ses-xyz");
  });

  it("handles non-array data from list gracefully (does not crash)", async () => {
    const client = {
      session: {
        list: jest.fn(() => Promise.resolve({ data: null })),
        create: jest.fn(),
        delete: jest.fn(),
      },
    } as unknown as Parameters<typeof useSessions>[0];

    const { result } = renderHook(() => useSessions(client, DIR));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.sessions).toEqual([]);
  });
});
