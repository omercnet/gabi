import { makeAssistantMessage, makeTextPart, makeUserMessage } from "@/test/factories";
import { processMessages } from "../processMessages";

describe("processMessages", () => {
  it("returns empty array for empty input", () => {
    expect(processMessages([], {})).toEqual([]);
  });

  it("returns message with empty parts when no parts exist", () => {
    const msg = makeUserMessage();
    const result = processMessages([msg], {});
    expect(result).toHaveLength(1);
    expect(result[0]?.parts).toEqual([]);
  });

  it("hydrates message with matching parts", () => {
    const msg = makeAssistantMessage({ id: "msg-1" });
    const part = makeTextPart({ id: "p1", messageID: "msg-1" });
    const result = processMessages([msg], { "msg-1": { p1: part } });
    expect(result[0]?.parts).toHaveLength(1);
    expect(result[0]!.parts[0]).toBe(part);
  });

  it("sorts messages by time.created ascending", () => {
    const older = makeUserMessage({ id: "a", time: { created: 100, updated: 100 } });
    const newer = makeAssistantMessage({ id: "b", time: { created: 200, updated: 200 } });
    const result = processMessages([newer, older], {});
    expect(result[0]?.message.id).toBe("a");
    expect(result[1]?.message.id).toBe("b");
  });

  it("ignores parts for non-existent message IDs", () => {
    const msg = makeUserMessage({ id: "msg-1" });
    const result = processMessages([msg], { "msg-999": { p1: makeTextPart() } });
    expect(result[0]?.parts).toEqual([]);
  });

  it("includes multiple parts per message", () => {
    const msg = makeAssistantMessage({ id: "msg-1" });
    const p1 = makeTextPart({ id: "p1", messageID: "msg-1" });
    const p2 = makeTextPart({ id: "p2", messageID: "msg-1" });
    const result = processMessages([msg], { "msg-1": { p1, p2 } });
    expect(result[0]?.parts).toHaveLength(2);
  });

  it("does not crash when message.time is undefined (streaming/pending messages)", () => {
    const noTime = {
      ...makeUserMessage(),
      time: undefined,
    } as unknown as import("@/client/types").Message;
    expect(() => processMessages([noTime], {})).not.toThrow();
    const result = processMessages([noTime], {});
    expect(result).toHaveLength(1);
  });

  it("sorts messages with missing time before messages with time", () => {
    const noTime = {
      ...makeUserMessage({ id: "no-time" }),
      time: undefined,
    } as unknown as import("@/client/types").Message;
    const withTime = makeUserMessage({ id: "with-time", time: { created: 100, updated: 100 } });
    const result = processMessages([withTime, noTime], {});
    // no-time treated as 0, sorts before created=100
    expect(result[0]?.message.id).toBe("no-time");
    expect(result[1]?.message.id).toBe("with-time");
  });
});
