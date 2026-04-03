// Mock Reanimated to avoid window.matchMedia requirement in test env
jest.mock("react-native-reanimated", () => {
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: { View, createAnimatedComponent: (c: unknown) => c },
    FadeInUp: { duration: () => ({ delay: () => ({}) }) },
    useSharedValue: (v: number) => ({ value: v }),
    useAnimatedStyle: () => ({}),
  };
});

import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { Pressable } from "react-native";
import { MessageBubble } from "@/components/chat/MessageBubble";
import {
  makeAssistantMessage,
  makeTextPart,
  makeToolPart,
  makeUserMessage,
} from "@/test/factories";
import { resetAllStores } from "@/test/setup";
import type { RenderItem } from "@/transcript/types";

describe("MessageBubble", () => {
  beforeEach(resetAllStores);

  it("renders user bubble with content text", () => {
    const message = makeUserMessage({ content: "hello" });
    render(<MessageBubble message={message} items={[]} />);

    expect(JSON.stringify(screen.toJSON())).toContain("hello");
  });

  it("user bubble has self-end alignment class", () => {
    expect(MessageBubble.toString()).toContain("self-end");
  });

  it("renders assistant bubble for non-user messages", () => {
    const message = makeAssistantMessage();
    render(<MessageBubble message={message} items={[]} />);

    expect(JSON.stringify(screen.toJSON())).not.toContain("hello");
  });

  it("assistant bubble renders items via PartRenderer/ToolGroup", () => {
    const message = makeAssistantMessage();
    const items: RenderItem[] = [
      { kind: "tool-group", summary: "Tools used", parts: [makeToolPart()] },
      { kind: "part", part: makeTextPart({ text: "assistant text" }) },
    ];

    render(<MessageBubble message={message} items={items} />);

    const out = JSON.stringify(screen.toJSON());
    expect(out).toContain("Tools used");
    expect(out).toContain("assistant text");
  });

  it("renders tool-group items with ToolGroup component", async () => {
    const message = makeAssistantMessage();
    const items: RenderItem[] = [
      { kind: "tool-group", summary: "Group summary", parts: [makeToolPart()] },
    ];

    render(<MessageBubble message={message} items={items} />);

    fireEvent.press(screen.UNSAFE_getByType(Pressable));

    await waitFor(() => {
      expect(JSON.stringify(screen.toJSON())).toContain("Group summary");
    });
  });

  it("renders single part items with PartRenderer", () => {
    const message = makeAssistantMessage();
    const items: RenderItem[] = [
      { kind: "part", part: makeTextPart({ text: "single part text" }) },
    ];

    render(<MessageBubble message={message} items={items} />);

    expect(JSON.stringify(screen.toJSON())).toContain("single part text");
  });

  it("empty items array renders empty assistant bubble", () => {
    const message = makeAssistantMessage();
    const { toJSON } = render(<MessageBubble message={message} items={[]} />);

    expect(toJSON()).toBeTruthy();
    // Feather icons don't render text content in test env, so just verify no leftover emoji
    expect(JSON.stringify(toJSON())).not.toContain("▶");
  });

  it("multiple items rendered in order", () => {
    const message = makeAssistantMessage();
    const items: RenderItem[] = [
      { kind: "part", part: makeTextPart({ text: "first" }) },
      { kind: "part", part: makeTextPart({ text: "second" }) },
      { kind: "tool-group", summary: "third", parts: [makeToolPart()] },
    ];

    const { toJSON } = render(<MessageBubble message={message} items={items} />);
    const snapshot = JSON.stringify(toJSON());

    expect(snapshot.indexOf("first")).toBeLessThan(snapshot.indexOf("second"));
    expect(snapshot.indexOf("second")).toBeLessThan(snapshot.indexOf("third"));
  });
});
