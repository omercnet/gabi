import * as Clipboard from "expo-clipboard";
import Feather from "@expo/vector-icons/Feather";
import { useIsMobile } from "@/hooks/useIsMobile";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";

// react-syntax-highlighter may have issues on native, so we try/catch
let SyntaxHighlighter: React.ComponentType<{
  language?: string;
  style?: Record<string, unknown>;
  showLineNumbers?: boolean;
  children: string;
  customStyle?: Record<string, unknown>;
  codeTagProps?: Record<string, unknown>;
}> | null = null;

let atomOneDark: Record<string, unknown> | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const rsh = require("react-syntax-highlighter");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const styles = require("react-syntax-highlighter/dist/esm/styles/hljs");
  SyntaxHighlighter = rsh.default || rsh.Light || rsh;
  atomOneDark = styles.atomOneDark;
  atomOneDark = styles.atomOneDark;
} catch {
  // fallback — no highlighting
}

interface Props {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
}

export function CodeBlock({ code, language, showLineNumbers = false }: Props) {
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMobile = useIsMobile();
  const [wordWrap, setWordWrap] = useState(isMobile);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(code);
    setCopied(true);
    copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
  };

  const displayLanguage = language ?? "text";

  // Web: use SyntaxHighlighter component
  if (Platform.OS === "web" && SyntaxHighlighter && atomOneDark) {
    return (
      <View className="my-2 overflow-hidden rounded-md border border-border">
        {/* Header */}
        <View className="flex-row items-center justify-between bg-surface px-3 py-2 dark:bg-surface">
          <Text className="font-mono text-muted text-xs">{displayLanguage}</Text>
          <View className="flex-row items-center gap-1">
            <Pressable
              onPress={() => setWordWrap(!wordWrap)}
              className="rounded px-2 py-1 active:opacity-80"
              accessibilityLabel={wordWrap ? "Disable word wrap" : "Enable word wrap"}
            >
              <Feather name={wordWrap ? "align-left" : "code"} size={14} className="text-muted" />
            </Pressable>
            <Pressable
              onPress={handleCopy}
              className="rounded px-2 py-1 active:opacity-80"
              accessibilityLabel={copied ? "Copied!" : "Copy code"}
            >
              <Text className="text-muted text-xs dark:text-muted">
                {copied ? "✓ Copied!" : "Copy"}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Code with syntax highlighting */}
        {wordWrap ? (
          <SyntaxHighlighter
            language={displayLanguage}
            style={atomOneDark}
            showLineNumbers={showLineNumbers}
            customStyle={{
              margin: 0,
              padding: "12px",
              background: "transparent",
              fontSize: "13px",
              lineHeight: "1.5",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {code}
          </SyntaxHighlighter>
        ) : (
          <ScrollView horizontal={true} showsHorizontalScrollIndicator={true}>
            <SyntaxHighlighter
              language={displayLanguage}
              style={atomOneDark}
              showLineNumbers={showLineNumbers}
              customStyle={{
                margin: 0,
                padding: "12px",
                background: "transparent",
                fontSize: "13px",
                lineHeight: "1.5",
              }}
            >
              {code}
            </SyntaxHighlighter>
          </ScrollView>
        )}
      </View>
    );
  }

  // Native (or fallback): plain monospace text in horizontal ScrollView
  return (
    <View className="my-2 overflow-hidden rounded-md border border-border">
      {/* Header */}
      <View className="flex-row items-center justify-between bg-surface px-3 py-2">
        <Text className="font-mono text-muted text-xs">{displayLanguage}</Text>
        <View className="flex-row items-center gap-1">
          <Pressable
            onPress={() => setWordWrap(!wordWrap)}
            className="rounded px-2 py-1 active:opacity-80"
            accessibilityLabel={wordWrap ? "Disable word wrap" : "Enable word wrap"}
          >
            <Feather name={wordWrap ? "align-left" : "code"} size={14} className="text-muted" />
          </Pressable>
          <Pressable
            onPress={handleCopy}
            className="rounded px-2 py-1 active:opacity-80"
            accessibilityLabel={copied ? "Copied!" : "Copy code"}
          >
            <Text className="text-muted text-xs">{copied ? "✓ Copied!" : "Copy"}</Text>
          </Pressable>
        </View>
      </View>

      {/* Code body */}
      {wordWrap ? (
        <View className="bg-surface/50" style={{ padding: 12 }}>
          <Text className="font-mono text-foreground text-xs dark:text-foreground" selectable={true}>
            {code}
          </Text>
        </View>
      ) : (
        <ScrollView
          horizontal={true}
          showsHorizontalScrollIndicator={true}
          className="bg-surface/50"
          contentContainerStyle={{ padding: 12 }}
        >
          <Text className="font-mono text-foreground text-xs dark:text-foreground" selectable={true}>
            {code}
          </Text>
        </ScrollView>
      )}
    </View>
  );
}
