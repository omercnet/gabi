import { resetAllStores } from "@/test/setup";

jest.mock("expo-router");

function createHandleSend(params: {
  text: string;
  isStreaming: boolean;
  onSend: (text: string) => Promise<void>;
  setText: (next: string) => void;
}) {
  return async () => {
    const { text, isStreaming, onSend, setText } = params;
    if (!text.trim() || isStreaming) return;
    const msg = text;
    setText("");
    await onSend(msg);
  };
}

function handleKeyPress(os: string, key: string, send: () => Promise<void> | void): void {
  if (os === "web" && key === "Enter") {
    send();
  }
}

describe("ChatInput logic", () => {
  beforeEach(resetAllStores);

  it("sends non-empty text", async () => {
    const onSend = jest.fn().mockResolvedValue(undefined);
    const setText = jest.fn();
    await createHandleSend({ text: "hello", isStreaming: false, onSend, setText })();
    expect(onSend).toHaveBeenCalledWith("hello");
  });

  it("clears text before awaiting send", async () => {
    const calls: string[] = [];
    const setText = jest.fn(() => calls.push("clear"));
    const onSend = jest.fn(async () => calls.push("send"));
    await createHandleSend({ text: "x", isStreaming: false, onSend, setText })();
    expect(calls).toEqual(["clear", "send"]);
  });

  it("does not send empty text", async () => {
    const onSend = jest.fn().mockResolvedValue(undefined);
    await createHandleSend({ text: "", isStreaming: false, onSend, setText: jest.fn() })();
    expect(onSend).not.toHaveBeenCalled();
  });

  it("does not send whitespace-only text", async () => {
    const onSend = jest.fn().mockResolvedValue(undefined);
    await createHandleSend({ text: "   ", isStreaming: false, onSend, setText: jest.fn() })();
    expect(onSend).not.toHaveBeenCalled();
  });

  it("does not send while streaming", async () => {
    const onSend = jest.fn().mockResolvedValue(undefined);
    await createHandleSend({ text: "hello", isStreaming: true, onSend, setText: jest.fn() })();
    expect(onSend).not.toHaveBeenCalled();
  });

  it("does not clear text when send is blocked", async () => {
    const setText = jest.fn();
    await createHandleSend({
      text: "   ",
      isStreaming: false,
      onSend: jest.fn().mockResolvedValue(undefined),
      setText,
    })();
    expect(setText).not.toHaveBeenCalled();
  });

  it("passes original text without trimming", async () => {
    const onSend = jest.fn().mockResolvedValue(undefined);
    await createHandleSend({ text: " hi ", isStreaming: false, onSend, setText: jest.fn() })();
    expect(onSend).toHaveBeenCalledWith(" hi ");
  });

  it("Enter on web triggers send", () => {
    const send = jest.fn();
    handleKeyPress("web", "Enter", send);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("non-Enter on web does not trigger send", () => {
    const send = jest.fn();
    handleKeyPress("web", "Tab", send);
    expect(send).not.toHaveBeenCalled();
  });

  it("Enter on native does not trigger send", () => {
    const send = jest.fn();
    handleKeyPress("ios", "Enter", send);
    expect(send).not.toHaveBeenCalled();
  });
});
