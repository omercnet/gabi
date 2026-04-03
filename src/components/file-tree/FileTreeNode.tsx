import Feather from "@expo/vector-icons/Feather";
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
        className="flex-row items-center py-1 active:opacity-80"
        style={{ paddingLeft: 12 + depth * 16 }}
        onPress={() => node.isDir && setExpanded(!expanded)}
      >
        {node.isDir ? (
          <Feather
            name={expanded ? "chevron-down" : "chevron-right"}
            size={10}
            className="w-4 text-muted"
          />
        ) : (
          <View className="w-4" />
        )}
        <Feather name={node.isDir ? "folder" : "file-text"} size={12} className="mr-1 text-muted" />
        <Text className="flex-1 text-foreground text-xs" numberOfLines={1}>
          {node.name}
        </Text>
        {status ? <Text className={`mr-2 font-bold text-xs ${statusColor}`}>{status}</Text> : null}
      </Pressable>
      {expanded && node.children.length > 0
        ? node.children.map((child) => (
            <FileTreeNode key={child.path} node={child} depth={depth + 1} gitStatus={gitStatus} />
          ))
        : null}
    </View>
  );
}
