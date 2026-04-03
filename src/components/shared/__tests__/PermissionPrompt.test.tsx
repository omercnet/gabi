import { render } from "@testing-library/react-native";
import { PermissionPromptQueue } from "@/components/shared/PermissionPrompt";
import { usePermissionStore } from "@/stores/permissionStore";
import { makePermissionRequest } from "@/test/factories";
import { resetAllStores } from "@/test/setup";

// NOTE: PermissionPrompt uses React Native Modal (portal-based) which is
// incompatible with react-test-renderer. We test store interactions only.

describe("PermissionPromptQueue", () => {
  beforeEach(resetAllStores);

  it("renders nothing when pending queue is empty", () => {
    const { toJSON } = render(<PermissionPromptQueue />);
    expect(toJSON()).toBeNull();
  });

  it("is defined and exported", () => {
    expect(PermissionPromptQueue).toBeDefined();
  });

  it("reads first item from permissionStore pending list", () => {
    const r1 = makePermissionRequest({ permission: "file.read" });
    const r2 = makePermissionRequest({ permission: "network.request" });
    usePermissionStore.setState({ pending: [r1, r2] });
    expect(usePermissionStore.getState().pending).toHaveLength(2);
    expect(usePermissionStore.getState().pending[0]?.permission).toBe("file.read");
  });

  it("store remove() empties pending after action", () => {
    const request = makePermissionRequest({ permission: "file.write" });
    usePermissionStore.setState({ pending: [request] });
    usePermissionStore.getState().remove(request.id);
    expect(usePermissionStore.getState().pending).toHaveLength(0);
  });

  it("upsert adds multiple requests in order", () => {
    const r1 = makePermissionRequest({ permission: "a" });
    const r2 = makePermissionRequest({ permission: "b" });
    usePermissionStore.getState().upsert(r1);
    usePermissionStore.getState().upsert(r2);
    const pending = usePermissionStore.getState().pending;
    expect(pending[0]?.permission).toBe("a");
    expect(pending[1]?.permission).toBe("b");
  });
});
