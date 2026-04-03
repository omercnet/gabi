import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useIsMobile } from "@/hooks/useIsMobile";
import { CodeBlock } from "./CodeBlock";

interface Props {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className }: Props) {
  const isMobile = useIsMobile();

  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Headings
          h1: ({ children }) => (
            <h1
              className={
                isMobile
                  ? "mb-3 mt-4 font-bold text-foreground text-xl leading-tight"
                  : "mb-3 mt-4 font-bold text-foreground text-2xl leading-tight"
              }
            >
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2
              className={
                isMobile
                  ? "mb-2 mt-3 font-bold text-foreground text-lg leading-tight"
                  : "mb-2 mt-3 font-bold text-foreground text-xl leading-tight"
              }
            >
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3
              className={
                isMobile
                  ? "mb-2 mt-3 font-semibold text-foreground text-base leading-tight"
                  : "mb-2 mt-3 font-semibold text-foreground text-lg leading-tight"
              }
            >
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="mb-1 mt-2 font-semibold text-foreground text-base">{children}</h4>
          ),

          // Paragraphs
          p: ({ children }) => (
            <p className="mb-2 text-foreground text-sm leading-relaxed">{children}</p>
          ),

          // Code blocks and inline code
          code: ({ className: cls, children }) => {
            const match = /language-([-\w+]+)/.exec(cls ?? "");
            // Block code: has a language class OR children contain a newline (fenced without lang)
            const codeStr = String(children).replace(/\n$/, "");
            const isBlock = match !== null || String(children).includes("\n");

            if (isBlock) {
              return <CodeBlock code={codeStr} {...(match ? { language: match[1] } : {})} />;
            }

            // Inline code
            return (
              <code className="rounded bg-surface px-1 py-0.5 font-mono text-foreground text-xs">
                {children}
              </code>
            );
          },

          // Pre wrapper — handled by code component above
          pre: ({ children }) => <>{children}</>,

          // Lists
          ul: ({ children }) => <ul className="mb-2 ml-4 list-disc text-foreground">{children}</ul>,
          ol: ({ children }) => (
            <ol className="mb-2 ml-4 list-decimal text-foreground">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="mb-0.5 text-foreground text-sm leading-relaxed">{children}</li>
          ),

          // Blockquote
          blockquote: ({ children }) => (
            <blockquote className="my-2 border-l-4 border-border pl-3 text-muted">
              {children}
            </blockquote>
          ),

          // Horizontal rule
          hr: () => <hr className="my-3 border-border" />,

          // Strong / emphasis
          strong: ({ children }) => (
            <strong className="font-bold text-foreground">{children}</strong>
          ),
          em: ({ children }) => <em className="italic text-foreground">{children}</em>,

          // Links
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              {children}
            </a>
          ),

          // Tables (GFM)
          table: ({ children }) => (
            <div className="my-2 overflow-x-auto">
              <table className="w-full border-collapse border border-border text-sm">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-surface">{children}</thead>,
          tbody: ({ children }) => <tbody>{children}</tbody>,
          tr: ({ children }) => <tr className="border-b border-border">{children}</tr>,
          th: ({ children }) => (
            <th className="border border-border px-3 py-2 text-left font-semibold text-foreground text-sm">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-border px-3 py-2 text-foreground text-sm">{children}</td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
