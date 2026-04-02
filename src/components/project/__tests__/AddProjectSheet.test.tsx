import { fireEvent, render, screen } from "@testing-library/react-native";
import { AddProjectSheet } from "@/components/project/AddProjectSheet";
import { useProjectStore } from "@/stores/projectStore";
import { resetAllStores } from "@/test/setup";

jest.mock("@gorhom/bottom-sheet", () => {
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
    BottomSheetView: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
    BottomSheetTextInput: require("react-native").TextInput,
  };
});

describe("AddProjectSheet", () => {
  beforeEach(resetAllStores);

  it("renders the Add Project heading", () => {
    render(<AddProjectSheet onClose={jest.fn()} />);
    expect(JSON.stringify(screen.toJSON())).toContain("Add Project");
  });

  it("renders at least 2 text inputs", () => {
    render(<AddProjectSheet onClose={jest.fn()} />);
    const inputs = screen.UNSAFE_getAllByType(require("react-native").TextInput);
    expect(inputs.length).toBeGreaterThanOrEqual(2);
  });

  it("renders Cancel text", () => {
    render(<AddProjectSheet onClose={jest.fn()} />);
    expect(JSON.stringify(screen.toJSON())).toContain("Cancel");
  });

  it("store starts empty before any interaction", () => {
    render(<AddProjectSheet onClose={jest.fn()} />);
    expect(useProjectStore.getState().projects).toHaveLength(0);
  });

  it("store addProject action creates project correctly", () => {
    useProjectStore.getState().addProject("My Project", "/home/user");
    const projects = useProjectStore.getState().projects;
    expect(projects).toHaveLength(1);
    expect(projects[0]?.name).toBe("My Project");
    expect(projects[0]?.directory).toBe("/home/user");
  });

  it("inputs accept typed values", () => {
    render(<AddProjectSheet onClose={jest.fn()} />);
    const inputs = screen.UNSAFE_getAllByType(require("react-native").TextInput);
    fireEvent.changeText(inputs[0], "New Project");
    fireEvent.changeText(inputs[1], "/home/dev/proj");
    expect(inputs[0].props.value).toBe("New Project");
    expect(inputs[1].props.value).toBe("/home/dev/proj");
  });
});
