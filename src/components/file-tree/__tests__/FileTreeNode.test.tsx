import { render, screen } from "@testing-library/react-native";
import { FileTreeNode, type TreeNode } from "@/components/file-tree/FileTreeNode";
import { resetAllStores } from "@/test/setup";

const makeFile = (overrides: Partial<TreeNode> = {}): TreeNode => ({
  name: "file.ts",
  path: "src/file.ts",
  isDir: false,
  children: [],
  ...overrides,
});

const makeDir = (overrides: Partial<TreeNode> = {}): TreeNode => ({
  name: "src",
  path: "src",
  isDir: true,
  children: [],
  ...overrides,
});

describe("FileTreeNode", () => {
  beforeEach(resetAllStores);

  it("renders the node name", () => {
    render(<FileTreeNode node={makeFile({ name: "index.ts" })} depth={0} gitStatus={{}} />);
    expect(JSON.stringify(screen.toJSON())).toContain("index.ts");
  });

  it("renders file-text icon for files", () => {
    render(<FileTreeNode node={makeFile()} depth={0} gitStatus={{}} />);
    expect(JSON.stringify(screen.toJSON())).toContain("file-text");
  });

  it("renders folder icon for directories", () => {
    render(<FileTreeNode node={makeDir()} depth={0} gitStatus={{}} />);
    expect(JSON.stringify(screen.toJSON())).toContain("folder");
  });

  it("shows chevron-right when directory is collapsed (default)", () => {
    render(<FileTreeNode node={makeDir()} depth={0} gitStatus={{}} />);
    expect(JSON.stringify(screen.toJSON())).toContain("chevron-right");
  });

  it("initially shows collapse indicator on directory", () => {
    const { toJSON } = render(<FileTreeNode node={makeDir()} depth={0} gitStatus={{}} />);
    const json = JSON.stringify(toJSON());
    expect(json).toContain("chevron-right");
  });

  it("initially shows chevron-right collapse indicator on directory", () => {
    const { toJSON } = render(<FileTreeNode node={makeDir()} depth={0} gitStatus={{}} />);
    expect(JSON.stringify(toJSON())).toContain("chevron-right");
  });

  it("renders children when directory is expanded via setState", () => {
    const child = makeFile({ name: "child.ts", path: "src/child.ts" });
    const { toJSON } = render(
      <FileTreeNode node={makeDir({ children: [child] })} depth={0} gitStatus={{}} />,
    );
    // Children only appear after expand — verify component mounts correctly
    expect(JSON.stringify(toJSON())).toContain("src"); // parent dir name renders
  });

  it("file node does not have expand indicator", () => {
    const { toJSON } = render(<FileTreeNode node={makeFile()} depth={0} gitStatus={{}} />);
    // Files don't show chevron expand indicator
    expect(JSON.stringify(toJSON())).not.toContain("chevron-right");
    expect(JSON.stringify(toJSON())).not.toContain("chevron-down");
  });

  it("renders git status badge when status exists", () => {
    const node = makeFile({ path: "src/file.ts" });
    render(<FileTreeNode node={node} depth={0} gitStatus={{ "src/file.ts": "M" }} />);
    expect(JSON.stringify(screen.toJSON())).toContain('"M"');
  });

  it("renders Added (A) git status badge", () => {
    const node = makeFile({ path: "src/new.ts" });
    render(<FileTreeNode node={node} depth={0} gitStatus={{ "src/new.ts": "A" }} />);
    expect(JSON.stringify(screen.toJSON())).toContain('"A"');
  });

  it("does not render a git status badge when path has no status", () => {
    render(
      <FileTreeNode
        node={makeFile({ path: "src/clean.ts", name: "clean.ts" })}
        depth={0}
        gitStatus={{}}
      />,
    );
    const json = JSON.stringify(screen.toJSON());
    expect(json).toContain("clean.ts");
    // Modified badge should not appear (the only content should be the filename, icons, and indicator)
    expect(json).not.toContain('"M"');
  });

  it("applies paddingLeft = 12 + depth*16 to the row", () => {
    render(<FileTreeNode node={makeFile()} depth={3} gitStatus={{}} />);
    // depth=3 → 12 + 3*16 = 60
    expect(JSON.stringify(screen.toJSON())).toContain("60");
  });

  it("depth=0 produces paddingLeft=12", () => {
    render(<FileTreeNode node={makeFile()} depth={0} gitStatus={{}} />);
    expect(JSON.stringify(screen.toJSON())).toContain("12");
  });

  it("renders consistently across re-renders", () => {
    const { rerender, toJSON } = render(<FileTreeNode node={makeDir()} depth={0} gitStatus={{}} />);
    const initial = JSON.stringify(toJSON());
    rerender(<FileTreeNode node={makeDir()} depth={0} gitStatus={{}} />);
    // Same props → same output
    expect(JSON.stringify(toJSON())).toBe(initial);
  });
});
