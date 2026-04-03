import { act, render, screen, waitFor } from "@testing-library/react-native";
import type { OpencodeClient } from "@/client/types";
import { FileTree } from "@/components/file-tree/FileTree";
import { resetAllStores } from "@/test/setup";

type MockClient = Pick<OpencodeClient, never> & {
  find: { files: jest.Mock };
  file: { status: jest.Mock };
};

function makeMockClient(
  filePaths: string[] = [],
  statusData: Array<{ file: string; status: string }> = [],
): MockClient {
  return {
    find: {
      files: jest.fn().mockResolvedValue({ data: filePaths }),
    },
    file: {
      status: jest.fn().mockResolvedValue({ data: statusData }),
    },
  } as unknown as MockClient;
}

describe("FileTree", () => {
  beforeEach(resetAllStores);

  it("renders without crash when client is null", () => {
    const { toJSON } = render(<FileTree client={null} directory="/home/test" />);
    expect(toJSON()).toBeTruthy();
  });

  it("does not call find.files when client is null", async () => {
    const client = makeMockClient(["a.ts"]);
    render(<FileTree client={null} directory="/home/test" />);
    await act(async () => {});
    expect(client.find.files).not.toHaveBeenCalled();
  });

  it("does not call find.files when directory is empty string", async () => {
    const client = makeMockClient(["a.ts"]);
    render(<FileTree client={client as unknown as OpencodeClient} directory="" />);
    await act(async () => {});
    expect(client.find.files).not.toHaveBeenCalled();
  });

  it("calls find.files with correct directory on mount", async () => {
    const client = makeMockClient([]);
    render(<FileTree client={client as unknown as OpencodeClient} directory="/home/project" />);
    await waitFor(() => {
      expect(client.find.files).toHaveBeenCalledWith({
        directory: "/home/project",
        query: "",
      });
    });
  });

  it("shows 'No files' when file list is empty", async () => {
    const client = makeMockClient([]);
    render(<FileTree client={client as unknown as OpencodeClient} directory="/home/project" />);
    await waitFor(() => {
      expect(JSON.stringify(screen.toJSON())).toContain("No files");
    });
  });

  it("renders the src directory node for src/index.ts", async () => {
    const client = makeMockClient(["src/index.ts", "src/utils.ts"]);
    render(<FileTree client={client as unknown as OpencodeClient} directory="/home/project" />);
    await waitFor(() => {
      // FlatList shows top-level tree nodes; src/ dir is the top-level node
      expect(JSON.stringify(screen.toJSON())).toContain("src");
    });
  });

  it("builds nested tree: src/ directory appears for src/index.ts", async () => {
    const client = makeMockClient(["src/index.ts", "src/utils/helper.ts", "README.md"]);
    render(<FileTree client={client as unknown as OpencodeClient} directory="/home/project" />);
    await waitFor(() => {
      const json = JSON.stringify(screen.toJSON());
      expect(json).toContain("src");
      expect(json).toContain("README.md");
    });
  });

  it("calls file.status for git status on mount", async () => {
    const client = makeMockClient(["src/index.ts"]);
    render(<FileTree client={client as unknown as OpencodeClient} directory="/home/project" />);
    await waitFor(() => {
      expect(client.file.status).toHaveBeenCalledWith({ directory: "/home/project" });
    });
  });

  it("renders git status badge on a root-level modified file", async () => {
    // Use a root-level file so it appears directly in the FlatList (not inside collapsed dir)
    const client = makeMockClient(["README.md"], [{ file: "README.md", status: "M" }]);
    render(<FileTree client={client as unknown as OpencodeClient} directory="/home/project" />);
    await waitFor(() => {
      expect(JSON.stringify(screen.toJSON())).toContain('"M"');
    });
  });
});
