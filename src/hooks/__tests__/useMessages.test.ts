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

describe("useMessages", () => {
  beforeEach(resetAllStores);

  it("returns empty array when sessionId is null", () => {
    const { result } = renderHook(() => useMessages(null));
    expect(result.current).toEqual([]);
  });

  it("returns empty array when no messages for session", () => {
    const { result } = renderHook(() => useMessages("ses-1"));
    expect(result.current).toEqual([]);
  });

  it("correctly hydrates messages from messageStore.messagesBySession + partsByMessage", () => {
    const message = makeAssistantMessage({ id: "msg-1", sessionID: "ses-1" });
    const part = makeTextPart({ id: "p1", messageID: "msg-1", sessionID: "ses-1" });

    useMessageStore.setState({
      messagesBySession: { "ses-1": [message] },
      partsByMessage: { "msg-1": { p1: part } },
    });

    const { result } = renderHook(() => useMessages("ses-1"));

    expect(result.current).toHaveLength(1);
    expect(result.current[0].message.id).toBe("msg-1");
    expect(result.current[0].items).toHaveLength(1);
    expect(result.current[0].items[0].kind).toBe("part");
    if (result.current[0].items[0].kind === "part") {
      expect(result.current[0].items[0].part.id).toBe("p1");
    }
  });

  it("returns processed messages with grouped parts", () => {
    const newer = makeUserMessage({
      id: "msg-2",
      sessionID: "ses-1",
      time: { created: 20 },
    });
    const older = makeAssistantMessage({
      id: "msg-1",
      sessionID: "ses-1",
      time: { created: 10 },
    });
    const t1 = makeToolPart({ id: "t1", messageID: "msg-1", sessionID: "ses-1" });
    const t2 = makeToolPart({ id: "t2", messageID: "msg-1", sessionID: "ses-1" });

    useMessageStore.setState({
      messagesBySession: { "ses-1": [newer, older] },
      partsByMessage: { "msg-1": { t1, t2 } },
    });

    const { result } = renderHook(() => useMessages("ses-1"));

    expect(result.current).toHaveLength(2);
    expect(result.current[0].message.id).toBe("msg-1");
    expect(result.current[0].items).toHaveLength(1);
    expect(result.current[0].items[0].kind).toBe("tool-group");
  });

  it("groups consecutive tool parts into tool-group", () => {
    const message = makeAssistantMessage({ id: "msg-1", sessionID: "ses-1" });
    const t1 = makeToolPart({ id: "t1", messageID: "msg-1", sessionID: "ses-1" });
    const t2 = makeToolPart({ id: "t2", messageID: "msg-1", sessionID: "ses-1" });

    useMessageStore.setState({
      messagesBySession: { "ses-1": [message] },
      partsByMessage: { "msg-1": { t1, t2 } },
    });

    const { result } = renderHook(() => useMessages("ses-1"));

    expect(result.current[0].items).toHaveLength(1);
    expect(result.current[0].items[0].kind).toBe("tool-group");
  });

  it("single tool part stays as single part item", () => {
    const message = makeAssistantMessage({ id: "msg-1", sessionID: "ses-1" });
    const tool = makeToolPart({ id: "tool-1", messageID: "msg-1", sessionID: "ses-1" });

    useMessageStore.setState({
      messagesBySession: { "ses-1": [message] },
      partsByMessage: { "msg-1": { "tool-1": tool } },
    });

    const { result } = renderHook(() => useMessages("ses-1"));

    expect(result.current[0].items).toHaveLength(1);
    expect(result.current[0].items[0].kind).toBe("part");
    if (result.current[0].items[0].kind === "part") {
      expect(result.current[0].items[0].part.type).toBe("tool");
    }
  });

  it("text parts are single part items", () => {
    const message = makeAssistantMessage({ id: "msg-1", sessionID: "ses-1" });
    const p1 = makeTextPart({ id: "p1", messageID: "msg-1", sessionID: "ses-1" });
    const p2 = makeTextPart({ id: "p2", messageID: "msg-1", sessionID: "ses-1" });

    useMessageStore.setState({
      messagesBySession: { "ses-1": [message] },
      partsByMessage: { "msg-1": { p1, p2 } },
    });

    const { result } = renderHook(() => useMessages("ses-1"));

    expect(result.current[0].items).toHaveLength(2);
    expect(result.current[0].items.every((item) => item.kind === "part")).toBe(true);
    for (const item of result.current[0].items) {
      if (item.kind === "part") {
        expect(item.part.type).toBe("text");
      }
    }
  });

  it("updates when store changes", () => {
    const { result } = renderHook(() => useMessages("ses-1"));

    expect(result.current).toEqual([]);

    const message = makeAssistantMessage({ id: "msg-1", sessionID: "ses-1" });
    const textPart = makeTextPart({ id: "p1", messageID: "msg-1", sessionID: "ses-1" });

    act(() => {
      useMessageStore.setState({
        messagesBySession: { "ses-1": [message] },
        partsByMessage: { "msg-1": { p1: textPart } },
      });
    });

    expect(result.current).toHaveLength(1);
    expect(result.current[0].message.id).toBe("msg-1");
  });
});
