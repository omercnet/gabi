import { useColorScheme } from "react-native";
import Markdown from "react-native-markdown-display";
import { useIsMobile } from "@/hooks/useIsMobile";
import { CodeBlock } from "./CodeBlock";

interface Props {
  content: string;
  style?: object;
}

function buildStyles(isDark: boolean, isMobile: boolean) {
  const fg = isDark ? "#f5f5f5" : "#0f172a";
  const primary = isDark ? "rgb(45, 212, 191)" : "rgb(20, 184, 166)";
  const codeBg = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const borderColor = isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)";
  const separatorColor = isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)";
  const theadBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";

  return {
    body: { color: fg, fontSize: 14, lineHeight: 22 },
    heading1: {
      color: fg,
      fontSize: isMobile ? 20 : 24,
      fontWeight: "700" as const,
      marginBottom: 8,
      marginTop: 16,
    },
    heading2: {
      color: fg,
      fontSize: isMobile ? 18 : 20,
      fontWeight: "700" as const,
      marginBottom: 6,
      marginTop: 12,
    },
    heading3: {
      color: fg,
      fontSize: isMobile ? 16 : 18,
      fontWeight: "600" as const,
      marginBottom: 6,
      marginTop: 12,
    },
    heading4: {
      color: fg,
      fontSize: 16,
      fontWeight: "600" as const,
      marginBottom: 4,
      marginTop: 8,
    },
    paragraph: { color: fg, fontSize: 14, lineHeight: 22, marginBottom: 8 },
    bullet_list: { marginBottom: 8 },
    ordered_list: { marginBottom: 8 },
    list_item: { color: fg, fontSize: 14, lineHeight: 22 },
    code_inline: {
      fontFamily: "monospace",
      fontSize: 12,
      backgroundColor: codeBg,
      color: fg,
      paddingHorizontal: 4,
      paddingVertical: 2,
      borderRadius: 4,
    },
    code_block: {
      fontFamily: "monospace",
      fontSize: 12,
      backgroundColor: codeBg,
      padding: 12,
      borderRadius: 8,
    },
    fence: { fontFamily: "monospace", fontSize: 12, padding: 0, backgroundColor: "transparent" },
    blockquote: {
      borderLeftWidth: 4,
      borderLeftColor: borderColor,
      paddingLeft: 12,
      marginVertical: 8,
    },
    hr: { backgroundColor: separatorColor, height: 1, marginVertical: 12 },
    strong: { fontWeight: "700" as const },
    em: { fontStyle: "italic" as const },
    link: { color: primary, textDecorationLine: "underline" as const },
    table: { borderWidth: 1, borderColor: separatorColor, marginVertical: 8 },
    thead: { backgroundColor: theadBg },
    th: {
      fontWeight: "600" as const,
      padding: 8,
      borderWidth: 1,
      borderColor: separatorColor,
      color: fg,
    },
    td: { padding: 8, borderWidth: 1, borderColor: separatorColor, color: fg },
  };
}

export function MarkdownRenderer({ content, style }: Props) {
  const colorScheme = useColorScheme();
  const isMobile = useIsMobile();
  const baseStyles = buildStyles(colorScheme === "dark", isMobile);
  const mergedStyles = { ...baseStyles, ...(style as typeof baseStyles | undefined) };

  return (
    <Markdown
      style={mergedStyles}
      rules={{
        fence: (node, _children, _parent, _styles) => {
          const code = node.content ?? "";
          // node.info exists at runtime but may not be typed — access safely
          const language = (node as unknown as Record<string, unknown>).info as string | undefined;
          return <CodeBlock key={node.key} code={code} {...(language ? { language } : {})} />;
        },
        code_block: (node, _children, _parent, _styles) => {
          const code = node.content ?? "";
          return <CodeBlock key={node.key} code={code} />;
        },
      }}
    >
      {content}
    </Markdown>
  );
}
