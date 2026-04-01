import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";
import type { OpencodeClient } from "@/client/types";
import { FileTreeNode, type TreeNode } from "./FileTreeNode";

interface Props {
  client: OpencodeClient | null;
  directory: string;
}

interface BuildNode {
  name: string;
  path: string;
  isDir: boolean;
  children: Record<string, BuildNode>;
}

function buildTree(paths: string[]): TreeNode[] {
  const root: Record<string, BuildNode> = {};

  for (const filePath of paths) {
    const segments = filePath.split("/").filter(Boolean);
    let current = root;
    for (let i = 0; i < segments.length; i++) {
      const name = segments[i];
      if (!current[name]) {
        current[name] = {
          name,
          path: segments.slice(0, i + 1).join("/"),
          isDir: i < segments.length - 1,
          children: {},
        };
      }
      if (i < segments.length - 1) {
        current[name].isDir = true;
      }
      current = current[name].children;
    }
  }

  const flatten = (nodes: Record<string, BuildNode>): TreeNode[] =>
    Object.values(nodes)
      .map(
        (n): TreeNode => ({
          name: n.name,
          path: n.path,
          isDir: n.isDir,
          children: flatten(n.children),
        }),
      )
      .sort((a, b) => {
        if (a.isDir && !b.isDir) return -1;
        if (!a.isDir && b.isDir) return 1;
        return a.name.localeCompare(b.name);
      });

  return flatten(root);
}

export function FileTree({ client, directory }: Props) {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [gitStatus, setGitStatus] = useState<Record<string, string>>({});

  const loadFiles = useCallback(async () => {
    if (!client || !directory) return;
    setLoading(true);
    try {
      const result = await client.find.files({ directory, query: "" });
      if (result.data && Array.isArray(result.data)) {
        setTree(buildTree(result.data as string[]));
      }
    } catch {
      setTree([]);
    }

    try {
      const status = await client.file.status({ directory });
      if (status.data && typeof status.data === "object") {
        const statusMap: Record<string, string> = {};
        if (Array.isArray(status.data)) {
          for (const item of status.data) {
            if (item && typeof item === "object" && "file" in item && "status" in item) {
              statusMap[String(item.file)] = String(item.status);
            }
          }
        }
        setGitStatus(statusMap);
      }
    } catch {
      setGitStatus({});
    }
    setLoading(false);
  }, [client, directory]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  if (loading) {
    return (
      <View className="p-4">
        <ActivityIndicator size="small" />
      </View>
    );
  }

  if (tree.length === 0) {
    return (
      <View className="p-4">
        <Text className="text-sm text-muted">No files</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={tree}
      keyExtractor={(item) => item.path}
      renderItem={({ item }) => <FileTreeNode node={item} depth={0} gitStatus={gitStatus} />}
    />
  );
}
