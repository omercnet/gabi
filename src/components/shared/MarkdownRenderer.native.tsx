import Markdown from "react-native-markdown-display";
import { CodeBlock } from "./CodeBlock";

interface Props {
  content: string;
  style?: object;
}

// Design token colors — these match the CSS variable values for default (light) theme.
// We layer via the style prop so the caller can override for dark mode if needed.
const defaultStyles = {
  body: {
    color: "rgb(var(--color-foreground, 15 23 42))",
    fontSize: 14,
    lineHeight: 22,
  },
  heading1: {
    color: "rgb(var(--color-foreground, 15 23 42))",
    fontSize: 24,
    fontWeight: "700" as const,
    marginBottom: 8,
    marginTop: 16,
  },
  heading2: {
    color: "rgb(var(--color-foreground, 15 23 42))",
    fontSize: 20,
    fontWeight: "700" as const,
    marginBottom: 6,
    marginTop: 12,
  },
  heading3: {
    color: "rgb(var(--color-foreground, 15 23 42))",
    fontSize: 18,
    fontWeight: "600" as const,
    marginBottom: 6,
    marginTop: 12,
  },
  heading4: {
    color: "rgb(var(--color-foreground, 15 23 42))",
    fontSize: 16,
    fontWeight: "600" as const,
    marginBottom: 4,
    marginTop: 8,
  },
  paragraph: {
    color: "rgb(var(--color-foreground, 15 23 42))",
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 8,
  },
  bullet_list: {
    marginBottom: 8,
  },
  ordered_list: {
    marginBottom: 8,
  },
  list_item: {
    color: "rgb(var(--color-foreground, 15 23 42))",
    fontSize: 14,
    lineHeight: 22,
  },
  code_inline: {
    fontFamily: "ui-monospace, monospace",
    fontSize: 12,
    backgroundColor: "rgba(0,0,0,0.06)",
    color: "rgb(var(--color-foreground, 15 23 42))",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  code_block: {
    // Overridden by custom rules below — kept as fallback
    fontFamily: "ui-monospace, monospace",
    fontSize: 12,
    backgroundColor: "rgba(0,0,0,0.06)",
    padding: 12,
    borderRadius: 8,
  },
  fence: {
    fontFamily: "ui-monospace, monospace",
    fontSize: 12,
    padding: 0,
    backgroundColor: "transparent",
  },
  blockquote: {
    borderLeftWidth: 4,
    borderLeftColor: "rgba(0,0,0,0.2)",
    paddingLeft: 12,
    marginVertical: 8,
  },
  hr: {
    backgroundColor: "rgba(0,0,0,0.15)",
    height: 1,
    marginVertical: 12,
  },
  strong: {
    fontWeight: "700" as const,
  },
  em: {
    fontStyle: "italic" as const,
  },
  link: {
    color: "rgb(var(--color-primary, 99 102 241))",
    textDecorationLine: "underline" as const,
  },
  table: {
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.15)",
    marginVertical: 8,
  },
  thead: {
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  th: {
    fontWeight: "600" as const,
    padding: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.15)",
    color: "rgb(var(--color-foreground, 15 23 42))",
  },
  td: {
    padding: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.15)",
    color: "rgb(var(--color-foreground, 15 23 42))",
  },
};

export function MarkdownRenderer({ content, style }: Props) {
  const mergedStyles = { ...defaultStyles, ...(style as typeof defaultStyles | undefined) };

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
