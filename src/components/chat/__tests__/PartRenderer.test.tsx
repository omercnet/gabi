import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { Pressable } from "react-native";
import type { Part } from "@/client/types";
import { PartRenderer } from "@/components/chat/PartRenderer";
import { usePreferencesStore } from "@/stores/preferencesStore";
import { makeFilePart, makeReasoningPart, makeTextPart, makeToolPart } from "@/test/factories";
import { resetAllStores } from "@/test/setup";

describe("PartRenderer", () => {
  beforeEach(resetAllStores);

  it("renders text part with text content", () => {
    render(<PartRenderer part={makeTextPart({ text: "plain text" })} />);
    expect(JSON.stringify(screen.toJSON())).toContain("plain text");
  });

  it("renders reasoning part when showReasoning=true", async () => {
    usePreferencesStore.setState({ showReasoning: true });
    render(<PartRenderer part={makeReasoningPart({ text: "why this works" })} />);

    expect(JSON.stringify(screen.toJSON())).toContain("Thinking");
    fireEvent.press(screen.UNSAFE_getByType(Pressable));

    await waitFor(() => {
      expect(JSON.stringify(screen.toJSON())).toContain("why this works");
    });
  });

  it("hides reasoning part when showReasoning=false", () => {
    usePreferencesStore.setState({ showReasoning: false });
    const { toJSON } = render(<PartRenderer part={makeReasoningPart()} />);
    expect(toJSON()).toBeNull();
  });

  it("renders tool part when showToolCalls=true", () => {
    usePreferencesStore.setState({ showToolCalls: true });
    const { toJSON } = render(<PartRenderer part={makeToolPart({ tool: "run_terminal_cmd" })} />);
    expect(toJSON()).toBeTruthy();
  });

  it("hides tool part when showToolCalls=false", () => {
    usePreferencesStore.setState({ showToolCalls: false });
    const { toJSON } = render(<PartRenderer part={makeToolPart()} />);
    expect(toJSON()).toBeNull();
  });

  it("renders file part when showFileParts=true (shows filename)", () => {
    usePreferencesStore.setState({ showFileParts: true });
    render(<PartRenderer part={makeFilePart({ filename: "report.md" })} />);

    expect(JSON.stringify(screen.toJSON())).toContain("report.md");
  });

  it("hides file part when showFileParts=false", () => {
    usePreferencesStore.setState({ showFileParts: false });
    const { toJSON } = render(<PartRenderer part={makeFilePart()} />);
    expect(toJSON()).toBeNull();
  });

  it("renders step markers when showStepMarkers=true", () => {
    usePreferencesStore.setState({ showStepMarkers: true });
    const stepStart = { ...makeTextPart(), type: "step-start" } as unknown as Part;
    const { toJSON } = render(<PartRenderer part={stepStart} />);
    expect(toJSON()).toBeTruthy();
  });

  it("hides step markers when showStepMarkers=false", () => {
    usePreferencesStore.setState({ showStepMarkers: false });
    const stepFinish = { ...makeTextPart(), type: "step-finish" } as unknown as Part;
    const { toJSON } = render(<PartRenderer part={stepFinish} />);

    expect(toJSON()).toBeNull();
  });

  it("renders subtask part with description", () => {
    const subtask = {
      ...makeTextPart(),
      type: "subtask",
      description: "Run tests",
    } as unknown as Part;
    render(<PartRenderer part={subtask} />);

    expect(JSON.stringify(screen.toJSON())).toContain("Run tests");
  });

  it("returns null for unknown part types", () => {
    const unknownPart = { ...makeTextPart(), type: "unknown-part" } as unknown as Part;
    const { toJSON } = render(<PartRenderer part={unknownPart} />);

    expect(toJSON()).toBeNull();
  });

  it("preferences from preferencesStore control visibility", () => {
    const reasoning = makeReasoningPart({ text: "store controlled" });
    const { rerender } = render(<PartRenderer part={reasoning} />);
    expect(JSON.stringify(screen.toJSON())).toContain("Thinking");

    usePreferencesStore.setState({ showReasoning: false });
    rerender(<PartRenderer part={reasoning} />);

    expect(JSON.stringify(screen.toJSON())).not.toContain("Thinking");
  });
});
