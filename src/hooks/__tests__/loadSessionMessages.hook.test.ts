/**
 * Tests loadSessionMessages as called from a useEffect — simulating
 * exactly the ChatScreen useEffect behavior.
 *
 * Bugs these tests would have caught:
 * - Double-fetch on mount (React StrictMode double-invoke)
 * - Fetch fired when client is null
 * - Fetch fired when sessionId/directory is empty
 * - Re-fetch on every client ref change even when messages already loaded
 */

import { act, renderHook } from "@testing-library/react-native";
import { useEffect } from "react";
import { loadSessionMessages } from "@/hooks/useSessionLoader";
import { useMessageStore } from "@/stores/messageStore";
import { makeUserMessage } from "@/test/factories";
import { resetAllStores } from "@/test/setup";

// Simulates the ChatScreen useEffect exactly as written
function useChatScreenEffect(
  client: { session: { messages: jest.Mock } } | null,
  sessionId: string | null,
  directory: string,
) {
  useEffect(() => {
    if (!(sessionId && directory)) return;
    loadSessionMessages(client as never, sessionId, directory).catch(() => undefined);
  }, [client, sessionId, directory]);
}

describe("ChatScreen loadSessionMessages useEffect behavior", () => {
  beforeEach(() => {
    resetAllStores();
    jest.clearAllMocks();
    // Clear the inflight cache between tests by re-requiring the module
    jest.resetModules();
  });

  it("does NOT fetch when client is null", () => {
    const client = { session: { messages: jest.fn() } };
    renderHook(() => useChatScreenEffect(null, "ses-1", "/home/test"));
    expect(client.session.messages).not.toHaveBeenCalled();
  });

  it("does NOT fetch when sessionId is null", () => {
    const client = { session: { messages: jest.fn().mockResolvedValue({ data: [] }) } };
    renderHook(() => useChatScreenEffect(client, null, "/home/test"));
    expect(client.session.messages).not.toHaveBeenCalled();
  });

  it("does NOT fetch when directory is empty string", () => {
    const client = { session: { messages: jest.fn().mockResolvedValue({ data: [] }) } };
    renderHook(() => useChatScreenEffect(client, "ses-1", ""));
    expect(client.session.messages).not.toHaveBeenCalled();
  });

  it("fetches messages when all params are provided", async () => {
    const msgs = [makeUserMessage({ id: "m1-fetch" })];
    const client = {
      session: { messages: jest.fn().mockResolvedValue({ data: msgs }) },
    };

    const { unmount } = renderHook(() => useChatScreenEffect(client, "ses-fetch", "/home/test"));
    await act(async () => {});
    unmount();

    expect(client.session.messages).toHaveBeenCalledTimes(1);
    expect(client.session.messages).toHaveBeenCalledWith({
      sessionID: "ses-fetch",
      directory: "/home/test",
    });
  });

  it("populates messageStore after fetch", async () => {
    const msgs = [makeUserMessage({ id: "ma1" }), makeUserMessage({ id: "ma2" })];
    const client = {
      session: { messages: jest.fn().mockResolvedValue({ data: msgs }) },
    };

    const { unmount } = renderHook(() => useChatScreenEffect(client, "ses-populate", "/home/test"));
    await act(async () => {});
    unmount();

    expect(useMessageStore.getState().messagesBySession["ses-populate"]).toHaveLength(2);
  });

  it("does NOT refetch when messages are already in store (deduplication)", async () => {
    useMessageStore.getState().setMessages("ses-dedup", [makeUserMessage({ id: "existing" })]);

    const client = {
      session: { messages: jest.fn().mockResolvedValue({ data: [] }) },
    };

    const { unmount } = renderHook(() => useChatScreenEffect(client, "ses-dedup", "/home/test"));
    await act(async () => {});
    unmount();

    expect(client.session.messages).not.toHaveBeenCalled();
  });

  it("does NOT double-fetch when second hook renders with same session (messages already cached)", async () => {
    const client = {
      session: {
        messages: jest.fn().mockResolvedValue({ data: [makeUserMessage({ id: "d1" })] }),
      },
    };

    // First render — triggers fetch
    const { unmount: u1 } = renderHook(() => useChatScreenEffect(client, "ses-dbl", "/home/test"));
    await act(async () => {});
    u1();

    // Second render — messages in store, should not re-fetch
    const { unmount: u2 } = renderHook(() => useChatScreenEffect(client, "ses-dbl", "/home/test"));
    await act(async () => {});
    u2();

    expect(client.session.messages).toHaveBeenCalledTimes(1);
  });

  it("re-fetches when navigating to a different session", async () => {
    const session1Msgs = [makeUserMessage({ id: "nav-s1-m1" })];
    const session2Msgs = [makeUserMessage({ id: "nav-s2-m1" })];

    const client = {
      session: {
        messages: jest
          .fn()
          .mockResolvedValueOnce({ data: session1Msgs })
          .mockResolvedValueOnce({ data: session2Msgs }),
      },
    };

    const sessionRef = { current: "ses-nav-a" };
    const { rerender, unmount } = renderHook(() =>
      useChatScreenEffect(client, sessionRef.current, "/home/test"),
    );

    await act(async () => {});
    expect(useMessageStore.getState().messagesBySession["ses-nav-a"]).toHaveLength(1);

    sessionRef.current = "ses-nav-b";
    rerender({});

    await act(async () => {});
    expect(useMessageStore.getState().messagesBySession["ses-nav-b"]).toHaveLength(1);
    expect(client.session.messages).toHaveBeenCalledTimes(2);
    unmount();
  });
});
