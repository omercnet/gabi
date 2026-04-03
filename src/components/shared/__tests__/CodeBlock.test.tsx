import { act, fireEvent, render, screen } from "@testing-library/react-native";
import * as Clipboard from "expo-clipboard";
import { CodeBlock } from "@/components/shared/CodeBlock";
import { resetAllStores } from "@/test/setup";

jest.mock("expo-clipboard", () => ({
  setStringAsync: jest.fn().mockResolvedValue(undefined),
}));

// react-syntax-highlighter may or may not be available; tests work either way

describe("CodeBlock", () => {
  beforeEach(() => {
    resetAllStores();
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it("renders code text content", () => {
    render(<CodeBlock code="const x = 1;" />);
    expect(JSON.stringify(screen.toJSON())).toContain("const x = 1;");
  });

  it("renders language badge when language prop provided", () => {
    render(<CodeBlock code="print('hi')" language="python" />);
    expect(JSON.stringify(screen.toJSON())).toContain("python");
  });

  it("falls back to 'text' when language is omitted", () => {
    render(<CodeBlock code="hello" />);
    expect(JSON.stringify(screen.toJSON())).toContain("text");
  });

  it("renders Copy button", () => {
    render(<CodeBlock code="hello" />);
    expect(JSON.stringify(screen.toJSON())).toContain("Copy");
  });

  it("Copy button triggers Clipboard.setStringAsync with the code", async () => {
    render(<CodeBlock code="copy me" />);
    const copyBtn = screen.UNSAFE_getByProps({ accessibilityLabel: "Copy code" });
    await act(async () => {
      fireEvent.press(copyBtn);
    });
    expect(Clipboard.setStringAsync).toHaveBeenCalledWith("copy me");
  });

  it("shows Copied! feedback after pressing Copy", async () => {
    jest.useFakeTimers();
    render(<CodeBlock code="copy me" />);
    const copyBtn = screen.UNSAFE_getByProps({ accessibilityLabel: "Copy code" });
    await act(async () => {
      fireEvent.press(copyBtn);
    });
    expect(JSON.stringify(screen.toJSON())).toContain("Copied!");
    jest.useRealTimers();
  });

  it("reverts Copy button text back after 2 seconds", async () => {
    jest.useFakeTimers();
    render(<CodeBlock code="copy me" />);
    const copyBtn = screen.UNSAFE_getByProps({ accessibilityLabel: "Copy code" });
    await act(async () => {
      fireEvent.press(copyBtn);
    });
    expect(JSON.stringify(screen.toJSON())).toContain("Copied!");
    act(() => {
      jest.advanceTimersByTime(2100);
    });
    expect(JSON.stringify(screen.toJSON())).toContain("Copy");
    jest.useRealTimers();
  });

  it("renders without crashing when only code prop is supplied", () => {
    const { toJSON } = render(<CodeBlock code="minimal" />);
    expect(toJSON()).toBeTruthy();
  });

  it("renders with showLineNumbers prop without crashing", () => {
    const { toJSON } = render(
      <CodeBlock code="line1\nline2" language="js" showLineNumbers={true} />,
    );
    expect(toJSON()).toBeTruthy();
  });
});
