import { fireEvent, render } from "@testing-library/react-native";
import { Pressable, Text } from "react-native";
import { ToolGroup } from "@/components/chat/ToolGroup";
import { usePreferencesStore } from "@/stores/preferencesStore";
import { makeToolPart } from "@/test/factories";
import { resetAllStores } from "@/test/setup";
import type { CollapsedToolGroup } from "@/transcript/types";

const makeGroup = (summary = "2 tool calls"): CollapsedToolGroup => ({
  kind: "tool-group",
  summary,
  parts: [makeToolPart({ tool: "read_file" }), makeToolPart({ tool: "bash" })],
});

describe("ToolGroup", () => {
  beforeEach(resetAllStores);

  const textValues = (view: ReturnType<typeof render>) =>
    view.UNSAFE_getAllByType(Text).map((node) => String(node.props.children));

  it("renders summary text", () => {
    const view = render(<ToolGroup group={makeGroup("summary text")} />);
    expect(textValues(view).join(" ")).toContain("summary text");
  });

  it("is collapsed by default when collapseToolGroups=true", () => {
    usePreferencesStore.setState({ collapseToolGroups: true });
    const view = render(<ToolGroup group={makeGroup()} />);

    expect(textValues(view).join(" ")).toContain("2 tool calls");
    expect(textValues(view)).not.toContain("Read");
    expect(textValues(view)).not.toContain("Execute");
  });

  it("is expanded by default when collapseToolGroups=false", () => {
    usePreferencesStore.setState({ collapseToolGroups: false });
    const view = render(<ToolGroup group={makeGroup()} />);

    expect(textValues(view).join(" ")).toContain("2 tool calls");
    expect(textValues(view)).toContain("Read");
    expect(textValues(view)).toContain("Execute");
  });

  it("shows individual ToolParts when expanded", () => {
    usePreferencesStore.setState({ collapseToolGroups: false });
    const view = render(<ToolGroup group={makeGroup()} />);

    expect(textValues(view)).toContain("Read");
    expect(textValues(view)).toContain("Execute");
  });

  it("hides ToolParts when collapsed", () => {
    usePreferencesStore.setState({ collapseToolGroups: true });
    const view = render(<ToolGroup group={makeGroup()} />);

    expect(textValues(view)).not.toContain("Read");
    expect(textValues(view)).not.toContain("Execute");
  });

  it("toggle on press switches state", () => {
    usePreferencesStore.setState({ collapseToolGroups: true });
    const view = render(<ToolGroup group={makeGroup()} />);

    fireEvent.press(view.UNSAFE_getAllByType(Pressable)[0]);
    expect(textValues(view)).toContain("Read");

    fireEvent.press(view.UNSAFE_getAllByType(Pressable)[0]);
    expect(textValues(view)).not.toContain("Read");
  });
});
