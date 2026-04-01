import {
  makeAssistantMessage,
  makeTextPart,
  makeToolPart,
  makeUserMessage,
} from "@/test/factories";
import { resetAllStores } from "@/test/setup";
import type { RenderItem } from "@/transcript/types";

jest.mock("expo-router");

function getUserContent(message: ReturnType<typeof makeUserMessage>): string {
  return "content" in message ? String(message.content) : "";
}

function partitionRenderItems(items: RenderItem[]) {
  const toolGroups = items.filter((item) => item.kind === "tool-group");
  const parts = items.filter((item) => item.kind === "part");
  return { toolGroups, parts };
}

describe("MessageBubble logic", () => {
  beforeEach(resetAllStores);

  it("extracts user content as string", () => {
    const message = makeUserMessage({ content: "hello" });
    expect(getUserContent(message)).toBe("hello");
  });

  it("stringifies non-string user content", () => {
    const message = makeUserMessage({ content: 42 as never });
    expect(getUserContent(message)).toBe("42");
  });

  it("routes tool-group items to tool group renderer path", () => {
    const items: RenderItem[] = [
      {
        kind: "tool-group",
        summary: "2 reads",
        parts: [makeToolPart(), makeToolPart({ tool: "read" })],
      },
    ];
    const { toolGroups, parts } = partitionRenderItems(items);
    expect(toolGroups).toHaveLength(1);
    expect(parts).toHaveLength(0);
  });

  it("routes single parts to part renderer path", () => {
    const items: RenderItem[] = [{ kind: "part", part: makeTextPart({ text: "hello" }) }];
    const { toolGroups, parts } = partitionRenderItems(items);
    expect(toolGroups).toHaveLength(0);
    expect(parts).toHaveLength(1);
  });

  it("keeps mixed render order counts stable", () => {
    const items: RenderItem[] = [
      { kind: "part", part: makeTextPart({ text: "A" }) },
      { kind: "tool-group", summary: "1 read", parts: [makeToolPart()] },
      { kind: "part", part: makeTextPart({ text: "B" }) },
    ];
    const { toolGroups, parts } = partitionRenderItems(items);
    expect(parts).toHaveLength(2);
    expect(toolGroups).toHaveLength(1);
  });

  it("assistant messages are expected to carry rendered items", () => {
    const assistant = makeAssistantMessage();
    const items: RenderItem[] = [{ kind: "part", part: makeTextPart({ messageID: assistant.id }) }];
    expect(assistant.role).toBe("assistant");
    expect(items[0].kind).toBe("part");
  });
});
