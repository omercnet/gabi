import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { Pressable } from "react-native";
import { ReasoningPart } from "@/components/chat/ReasoningPart";
import { makeReasoningPart } from "@/test/factories";
import { resetAllStores } from "@/test/setup";

describe("ReasoningPart", () => {
  beforeEach(resetAllStores);

  it('renders "Thinking" label', () => {
    render(<ReasoningPart part={makeReasoningPart()} />);
    expect(JSON.stringify(screen.toJSON())).toContain("Thinking");
  });

  it("collapsed by default (shows chevron-right)", () => {
    render(<ReasoningPart part={makeReasoningPart({ text: "hidden by default" })} />);
    const out = JSON.stringify(screen.toJSON());
    expect(out).toContain("chevron-right");
    expect(out).toContain("Thinking");
    expect(out).not.toContain("hidden by default");
  });

  it("expands on press (shows chevron-down and text content)", async () => {
    render(<ReasoningPart part={makeReasoningPart({ text: "expanded details" })} />);

    fireEvent.press(screen.UNSAFE_getByType(Pressable));

    await waitFor(() => {
      const out = JSON.stringify(screen.toJSON());
      expect(out).toContain("chevron-down");
      expect(out).toContain("expanded details");
    });
  });

  it("collapses on second press", async () => {
    render(<ReasoningPart part={makeReasoningPart({ text: "toggle me" })} />);

    fireEvent.press(screen.UNSAFE_getByType(Pressable));
    await waitFor(() => expect(JSON.stringify(screen.toJSON())).toContain("toggle me"));

    fireEvent.press(screen.UNSAFE_getByType(Pressable));
    await waitFor(() => {
      const out = JSON.stringify(screen.toJSON());
      expect(out).toContain("chevron-right");
      expect(out).not.toContain("toggle me");
    });
  });
});
