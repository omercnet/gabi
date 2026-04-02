import { act, render, screen } from "@testing-library/react-native";
import type { Message } from "@/client/types";
import { MessageList } from "@/components/chat/MessageList";
import { makeAssistantMessage, makeUserMessage } from "@/test/factories";
import { resetAllStores } from "@/test/setup";
import type { RenderItem } from "@/transcript/types";

// Mock MessageBubble to avoid rendering full chat UI complexity
jest.mock("@/components/chat/MessageBubble", () => ({
  MessageBubble: ({ message }: { message: Message }) => {
    const { Text } = require("react-native");
    return <Text>{`bubble:${message.id}`}</Text>;
  },
}));

interface MessageView {
  message: Message;
  items: RenderItem[];
}

const makeView = (msg: Message): MessageView => ({ message: msg, items: [] });

describe("MessageList", () => {
  beforeEach(() => {
    resetAllStores();
    jest.useRealTimers();
  });

  it("renders without crash with empty messages array", () => {
    const { toJSON } = render(<MessageList messages={[]} isStreaming={false} />);
    expect(toJSON()).toBeTruthy();
  });

  it("renders message content for each message", () => {
    const msgs = [makeUserMessage({ id: "u1" }), makeAssistantMessage({ id: "a1" })];
    render(<MessageList messages={msgs.map(makeView)} isStreaming={false} />);
    const json = JSON.stringify(screen.toJSON());
    expect(json).toContain("bubble:u1");
    expect(json).toContain("bubble:a1");
  });

  it("renders content for all N messages", () => {
    const msgs = Array.from({ length: 3 }, (_, i) => makeUserMessage({ id: `m${i}` }));
    render(<MessageList messages={msgs.map(makeView)} isStreaming={false} />);
    const json = JSON.stringify(screen.toJSON());
    expect(json).toContain("bubble:m0");
    expect(json).toContain("bubble:m1");
    expect(json).toContain("bubble:m2");
  });

  it("uses message.id in bubble label", () => {
    const msg = makeUserMessage({ id: "unique-123" });
    render(<MessageList messages={[makeView(msg)]} isStreaming={false} />);
    expect(JSON.stringify(screen.toJSON())).toContain("bubble:unique-123");
  });

  it("re-renders with new message included", () => {
    const msgs = [makeUserMessage({ id: "orig" })];
    const { rerender } = render(<MessageList messages={msgs.map(makeView)} isStreaming={false} />);
    const extended = [...msgs, makeAssistantMessage({ id: "rep" })];
    rerender(<MessageList messages={extended.map(makeView)} isStreaming={false} />);
    const json = JSON.stringify(screen.toJSON());
    expect(json).toContain("bubble:orig");
    expect(json).toContain("bubble:rep");
  });

  it("renders messages correctly before and after scroll timer fires", () => {
    jest.useFakeTimers();
    const msgs = [makeUserMessage({ id: "u1" })];
    render(<MessageList messages={msgs.map(makeView)} isStreaming={false} />);
    expect(JSON.stringify(screen.toJSON())).toContain("bubble:u1");
    // Advance past the 100ms scroll timer — component stays mounted without error
    act(() => {
      jest.advanceTimersByTime(200);
    });
    expect(JSON.stringify(screen.toJSON())).toContain("bubble:u1");
    jest.useRealTimers();
  });
});
