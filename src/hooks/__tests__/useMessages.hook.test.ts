/**
 * Tests useMessages AS A REAL HOOK with renderHook.
 *
 * The existing useMessages.test.ts tests processMessages logic directly.
 * This file tests the ACTUAL HOOK — reactive updates, memoization, deps.
 *
 * Bugs these tests would have caught:
 * - useMessages returning stale data after store updates
 * - useMessages not reacting to partsByMessage changes
 * - processMessages crash when message.time is undefined (regression guard)
 */

import { act, renderHook } from "@testing-library/react-native";
import { useMessages } from "@/hooks/useMessages";
import { useMessageStore } from "@/stores/messageStore";
import {
  makeAssistantMessage,
  makeTextPart,
  makeToolPart,
  makeUserMessage,
} from "@/test/factories";
import { resetAllStores } from "@/test/setup";

describe("useMessages (real hook)", () => {
  beforeEach(resetAllStores);

  it("returns empty array when sessionId is null", () => {
    const { result } = renderHook(() => useMessages(null));
    expect(result.current).toEqual([]);
  });

  it("returns empty array when no messages exist for session", () => {
    const { result } = renderHook(() => useMessages("ses-1"));
    expect(result.current).toEqual([]);
  });

  it("returns message views when store has messages", () => {
    const msg = makeUserMessage({ id: "m1", sessionID: "ses-1" });
    act(() => {
      useMessageStore.getState().setMessages("ses-1", [msg]);
    });
    const { result } = renderHook(() => useMessages("ses-1"));
    expect(result.current).toHaveLength(1);
    expect(result.current[0]?.message.id).toBe("m1");
  });

  it("reactively updates when messages are added to store", () => {
    const { result } = renderHook(() => useMessages("ses-1"));
    expect(result.current).toHaveLength(0);

    act(() => {
      useMessageStore
        .getState()
        .setMessages("ses-1", [
          makeUserMessage({ id: "m1", sessionID: "ses-1" }),
          makeAssistantMessage({ id: "m2", sessionID: "ses-1" }),
        ]);
    });

    expect(result.current).toHaveLength(2);
  });

  it("reactively updates when a new part is added via upsertPart", () => {
    const msg = makeAssistantMessage({ id: "msg-1", sessionID: "ses-1" });
    act(() => {
      useMessageStore.getState().setMessages("ses-1", [msg]);
    });

    const { result } = renderHook(() => useMessages("ses-1"));
    expect(result.current[0]?.items).toHaveLength(0);

    act(() => {
      useMessageStore
        .getState()
        .upsertPart("ses-1", "msg-1", makeTextPart({ id: "p1", messageID: "msg-1" }));
    });

    expect(result.current[0]?.items).toHaveLength(1);
  });

  it("does NOT include messages from a different session", () => {
    act(() => {
      useMessageStore.getState().setMessages("ses-A", [makeUserMessage({ id: "a1" })]);
      useMessageStore.getState().setMessages("ses-B", [makeUserMessage({ id: "b1" })]);
    });

    const { result } = renderHook(() => useMessages("ses-A"));
    expect(result.current).toHaveLength(1);
    expect(result.current[0]?.message.id).toBe("a1");
  });

  it("switches to new session when sessionId changes", () => {
    act(() => {
      useMessageStore.getState().setMessages("ses-A", [makeUserMessage({ id: "a1" })]);
      useMessageStore.getState().setMessages("ses-B", [makeAssistantMessage({ id: "b1" })]);
    });

    const sessionIdRef = { current: "ses-A" };
    const { result, rerender } = renderHook(() => useMessages(sessionIdRef.current));
    expect(result.current[0]?.message.id).toBe("a1");

    sessionIdRef.current = "ses-B";
    rerender({});
    expect(result.current[0]?.message.id).toBe("b1");
  });

  it("does NOT crash when message.time is undefined (real hook, regression)", () => {
    const noTime = {
      ...makeUserMessage({ id: "no-time", sessionID: "ses-1" }),
      time: undefined,
    } as unknown as ReturnType<typeof makeUserMessage>;

    act(() => {
      useMessageStore.getState().setMessages("ses-1", [noTime]);
    });

    expect(() => renderHook(() => useMessages("ses-1"))).not.toThrow();
    const { result } = renderHook(() => useMessages("ses-1"));
    expect(result.current).toHaveLength(1);
  });

  it("sorts messages by time.created ascending", () => {
    const older = makeUserMessage({ id: "older", time: { created: 100, updated: 100 } });
    const newer = makeAssistantMessage({ id: "newer", time: { created: 200, updated: 200 } });

    act(() => {
      // Add in wrong order
      useMessageStore.getState().setMessages("ses-1", [newer, older]);
    });

    const { result } = renderHook(() => useMessages("ses-1"));
    expect(result.current[0]?.message.id).toBe("older");
    expect(result.current[1]?.message.id).toBe("newer");
  });

  it("groups consecutive tool parts into a tool-group render item", () => {
    const msg = makeAssistantMessage({ id: "msg-1", sessionID: "ses-1" });
    act(() => {
      useMessageStore.getState().setMessages("ses-1", [msg]);
      useMessageStore
        .getState()
        .upsertPart("ses-1", "msg-1", makeToolPart({ id: "t1", messageID: "msg-1" }));
      useMessageStore
        .getState()
        .upsertPart("ses-1", "msg-1", makeToolPart({ id: "t2", messageID: "msg-1" }));
    });

    const { result } = renderHook(() => useMessages("ses-1"));
    const toolGroups = result.current[0]?.items.filter((i) => i.kind === "tool-group");
    expect(toolGroups?.length).toBeGreaterThanOrEqual(1);
  });

  it("returns empty array immediately after clearSession", () => {
    act(() => {
      useMessageStore.getState().setMessages("ses-1", [makeUserMessage({ id: "m1" })]);
    });

    const { result } = renderHook(() => useMessages("ses-1"));
    expect(result.current).toHaveLength(1);

    act(() => {
      useMessageStore.getState().clearSession("ses-1");
    });

    expect(result.current).toHaveLength(0);
  });
});
