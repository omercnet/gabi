import { render, screen } from "@testing-library/react-native";
import { ConnectionStatus } from "@/components/shared/ConnectionStatus";
import { useConnectionStore } from "@/stores/connectionStore";
import { resetAllStores } from "@/test/setup";

describe("ConnectionStatus", () => {
  beforeEach(resetAllStores);

  it("renders without crashing in default disconnected state", () => {
    const { toJSON } = render(<ConnectionStatus />);
    expect(toJSON()).toBeTruthy();
  });

  it("connected state: renders a dot (component present)", () => {
    useConnectionStore.setState({ sseStatus: "connected" });
    const { toJSON } = render(<ConnectionStatus />);
    expect(toJSON()).toBeTruthy();
  });

  it("reconnecting state: renders a dot (component present)", () => {
    useConnectionStore.setState({ sseStatus: "reconnecting" });
    const { toJSON } = render(<ConnectionStatus />);
    expect(toJSON()).toBeTruthy();
  });

  it("disconnected state: renders a dot (component present)", () => {
    useConnectionStore.setState({ sseStatus: "disconnected" });
    const { toJSON } = render(<ConnectionStatus />);
    expect(toJSON()).toBeTruthy();
  });

  it("showLabel=true renders label text 'Connected' when connected", () => {
    useConnectionStore.setState({ sseStatus: "connected" });
    render(<ConnectionStatus showLabel={true} />);
    expect(JSON.stringify(screen.toJSON())).toContain("Connected");
  });

  it("showLabel=true renders 'Reconnecting...' when reconnecting", () => {
    useConnectionStore.setState({ sseStatus: "reconnecting" });
    render(<ConnectionStatus showLabel={true} />);
    expect(JSON.stringify(screen.toJSON())).toContain("Reconnecting...");
  });

  it("showLabel=true renders 'Disconnected' when disconnected", () => {
    useConnectionStore.setState({ sseStatus: "disconnected" });
    render(<ConnectionStatus showLabel={true} />);
    expect(JSON.stringify(screen.toJSON())).toContain("Disconnected");
  });

  it("showLabel=false (default) renders no label text", () => {
    useConnectionStore.setState({ sseStatus: "connected" });
    render(<ConnectionStatus showLabel={false} />);
    expect(JSON.stringify(screen.toJSON())).not.toContain("Connected");
  });
});
