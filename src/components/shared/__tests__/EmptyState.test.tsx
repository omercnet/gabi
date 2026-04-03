import { fireEvent, render, screen } from "@testing-library/react-native";
import { EmptyState } from "@/components/shared/EmptyState";

describe("EmptyState", () => {
  it("renders the icon prop", () => {
    render(<EmptyState icon="🚀" title="Nothing here" />);
    expect(JSON.stringify(screen.toJSON())).toContain("🚀");
  });

  it("renders the title", () => {
    render(<EmptyState icon="📭" title="No messages yet" />);
    expect(JSON.stringify(screen.toJSON())).toContain("No messages yet");
  });

  it("renders subtitle when provided", () => {
    render(<EmptyState icon="📭" title="Empty" subtitle="Start by creating one" />);
    expect(JSON.stringify(screen.toJSON())).toContain("Start by creating one");
  });

  it("does not render subtitle when subtitle is omitted", () => {
    render(<EmptyState icon="📭" title="Empty" />);
    expect(JSON.stringify(screen.toJSON())).not.toContain("Start by creating one");
  });

  it("renders action button label when action prop provided", () => {
    const onPress = jest.fn();
    render(<EmptyState icon="📭" title="Empty" action={{ label: "Create New", onPress }} />);
    expect(JSON.stringify(screen.toJSON())).toContain("Create New");
  });

  it("action button fires onPress when pressed", () => {
    const onPress = jest.fn();
    render(<EmptyState icon="📭" title="Empty" action={{ label: "Go", onPress }} />);
    fireEvent.press(screen.UNSAFE_getByProps({ onPress }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("does not render an action button when action is omitted", () => {
    render(<EmptyState icon="📭" title="Empty" />);
    expect(JSON.stringify(screen.toJSON())).not.toContain("Create New");
  });

  it("renders Feather icon when iconName is provided", () => {
    render(<EmptyState iconName="message-square" title="No session" />);
    // Feather mock renders the icon name as text content
    expect(JSON.stringify(screen.toJSON())).toContain("message-square");
  });
});
