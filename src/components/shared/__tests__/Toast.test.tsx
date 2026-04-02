import { act, render, screen } from "@testing-library/react-native";
import { SSEToast, Toast } from "@/components/shared/Toast";
import { useConnectionStore } from "@/stores/connectionStore";
import { resetAllStores } from "@/test/setup";

describe("Toast", () => {
  beforeEach(() => {
    resetAllStores();
    jest.useRealTimers();
  });

  it("renders message text when visible=true", () => {
    render(<Toast message="Hello toast" visible={true} onDismiss={jest.fn()} />);
    expect(JSON.stringify(screen.toJSON())).toContain("Hello toast");
  });

  it("renders nothing when visible=false", () => {
    const { toJSON } = render(<Toast message="Hidden" visible={false} onDismiss={jest.fn()} />);
    expect(toJSON()).toBeNull();
  });

  it("renders the message prop text correctly", () => {
    render(<Toast message="Connection lost" visible={true} onDismiss={jest.fn()} />);
    expect(JSON.stringify(screen.toJSON())).toContain("Connection lost");
  });

  it("calls onDismiss after duration ms (auto-dismiss)", () => {
    jest.useFakeTimers();
    const onDismiss = jest.fn();
    render(<Toast message="Auto dismiss" visible={true} onDismiss={onDismiss} duration={1000} />);

    act(() => {
      jest.advanceTimersByTime(1600);
    });
    expect(onDismiss).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });

  it("does not call onDismiss before duration ms elapses", () => {
    jest.useFakeTimers();
    const onDismiss = jest.fn();
    render(<Toast message="Not yet" visible={true} onDismiss={onDismiss} duration={2000} />);

    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(onDismiss).not.toHaveBeenCalled();
    jest.useRealTimers();
  });

  it("uses default duration of 4000ms when duration prop omitted", () => {
    jest.useFakeTimers();
    const onDismiss = jest.fn();
    render(<Toast message="Default duration" visible={true} onDismiss={onDismiss} />);

    act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(onDismiss).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1600);
    });
    expect(onDismiss).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });
});

describe("SSEToast", () => {
  beforeEach(() => {
    resetAllStores();
    jest.useRealTimers();
  });

  it("renders nothing when sseStatus starts as disconnected", () => {
    useConnectionStore.setState({ sseStatus: "disconnected" });
    const { toJSON } = render(<SSEToast />);
    expect(toJSON()).toBeNull();
  });

  it("shows reconnecting message when sseStatus changes to reconnecting", () => {
    useConnectionStore.setState({ sseStatus: "connected" });
    render(<SSEToast />);

    act(() => {
      useConnectionStore.setState({ sseStatus: "reconnecting" });
    });

    expect(JSON.stringify(screen.toJSON())).toContain("Reconnecting to OpenCode...");
  });

  it("shows reconnected message when sseStatus changes from reconnecting to connected", () => {
    render(<SSEToast />);

    act(() => {
      useConnectionStore.setState({ sseStatus: "reconnecting" });
    });

    act(() => {
      useConnectionStore.setState({ sseStatus: "connected" });
    });

    expect(JSON.stringify(screen.toJSON())).toContain("Reconnected!");
  });

  it("does not show toast on initial connected state (no prior reconnecting)", () => {
    useConnectionStore.setState({ sseStatus: "connected" });
    const { toJSON } = render(<SSEToast />);
    expect(toJSON()).toBeNull();
  });
});
