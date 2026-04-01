import { useState } from "react";
import { Pressable, Text, View } from "react-native";

export interface TreeNode {
  name: string;
  path: string;
  isDir: boolean;
  children: TreeNode[];
}

interface Props {
  node: TreeNode;
  depth: number;
  gitStatus: Record<string, string>;
}

const STATUS_COLORS: Record<string, string> = {
  M: "text-warning",
  A: "text-success",
  D: "text-error",
  "?": "text-muted",
  R: "text-primary",
};

export function FileTreeNode({ node, depth, gitStatus }: Props) {
  const [expanded, setExpanded] = useState(false);
  const status = gitStatus[node.path];
  const statusColor = status ? (STATUS_COLORS[status] ?? "text-muted") : "";

  return (
    <View>
      <Pressable
        className="flex-row items-center py-1"
        style={{ paddingLeft: 12 + depth * 16 }}
        onPress={() => node.isDir && setExpanded(!expanded)}
      >
        <Text className="text-xs text-muted w-4">{node.isDir ? (expanded ? "▼" : "▶") : " "}</Text>
        <Text className="text-xs text-muted mr-1">{node.isDir ? "📁" : "📄"}</Text>
        <Text className="flex-1 text-xs text-foreground" numberOfLines={1}>
          {node.name}
        </Text>
        {status ? <Text className={`text-xs font-bold mr-2 ${statusColor}`}>{status}</Text> : null}
      </Pressable>
      {expanded && node.children.length > 0
        ? node.children.map((child) => (
            <FileTreeNode key={child.path} node={child} depth={depth + 1} gitStatus={gitStatus} />
          ))
        : null}
    </View>
  );
}
