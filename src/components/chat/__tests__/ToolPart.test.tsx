import { fireEvent, render } from "@testing-library/react-native";
import { Pressable, Text } from "react-native";
import { ToolPart } from "@/components/chat/ToolPart";
import { makeToolPart } from "@/test/factories";
import { resetAllStores } from "@/test/setup";

describe("ToolPart", () => {
  beforeEach(resetAllStores);

  const getText = (view: ReturnType<typeof render>) =>
    view.UNSAFE_getAllByType(Text).map((node) => String(node.props.children));

  it("renders normalized tool name label", () => {
    const view = render(<ToolPart part={makeToolPart({ tool: "read_file" })} />);
    expect(getText(view)).toContain("Read");
  });

  it("is collapsed by default", () => {
    const view = render(<ToolPart part={makeToolPart({ tool: "read_file" })} />);
    expect(getText(view)).toContain("▶");
    expect(getText(view)).not.toContain("▼");
  });

  it("expands on press", () => {
    const view = render(<ToolPart part={makeToolPart({ tool: "read_file" })} />);
    fireEvent.press(view.UNSAFE_getByType(Pressable));
    expect(getText(view)).toContain("▼");
  });

  it("shows input when expanded", () => {
    const part = Object.assign(makeToolPart({ tool: "read_file" }), {
      input: { path: "/tmp/demo.txt", recursive: false },
    });
    const view = render(<ToolPart part={part} />);
    fireEvent.press(view.UNSAFE_getByType(Pressable));

    const text = getText(view).join("\n");
    expect(text).toContain('"path": "/tmp/demo.txt"');
    expect(text).toContain('"recursive": false');
  });

  it("shows output when expanded", () => {
    const part = Object.assign(makeToolPart({ tool: "read_file" }), {
      output: { ok: true, lines: 3 },
    });
    const view = render(<ToolPart part={part} />);
    fireEvent.press(view.UNSAFE_getByType(Pressable));

    expect(getText(view)).toContain('{"ok":true,"lines":3}');
  });

  it("handles missing input/output gracefully", () => {
    const view = render(<ToolPart part={makeToolPart({ tool: "read_file" })} />);
    fireEvent.press(view.UNSAFE_getByType(Pressable));

    expect(getText(view)).toContain("▼");
    expect(getText(view)).not.toContain("file content");
  });
});
