import { render, screen } from "@testing-library/react-native";
import { MarkdownRenderer } from "@/components/shared/MarkdownRenderer.web";

// MarkdownRenderer.web.tsx renders HTML elements via react-markdown in jsdom

describe("MarkdownRenderer", () => {
  it("renders plain text content", () => {
    render(<MarkdownRenderer content="Hello world" />);
    expect(JSON.stringify(screen.toJSON())).toContain("Hello world");
  });

  it("renders bold markdown text", () => {
    render(<MarkdownRenderer content="This is **bold** text" />);
    // react-markdown renders <strong> elements
    expect(JSON.stringify(screen.toJSON())).toContain("bold");
  });

  it("renders italic markdown text", () => {
    render(<MarkdownRenderer content="This is _italic_ text" />);
    expect(JSON.stringify(screen.toJSON())).toContain("italic");
  });

  it("renders a markdown link", () => {
    render(<MarkdownRenderer content="Visit [OpenCode](https://opencode.ai)" />);
    expect(JSON.stringify(screen.toJSON())).toContain("OpenCode");
  });

  it("renders inline code", () => {
    render(<MarkdownRenderer content="Use `const x = 1` here" />);
    expect(JSON.stringify(screen.toJSON())).toContain("const x = 1");
  });

  it("renders a fenced code block (routes to CodeBlock)", () => {
    const content = "```javascript\nconsole.log('hi');\n```";
    render(<MarkdownRenderer content={content} />);
    // CodeBlock renders the code content
    // Syntax highlighter splits tokens into spans — search for key token
    expect(JSON.stringify(screen.toJSON())).toContain("console");
  });

  it("renders empty string without crash", () => {
    const { toJSON } = render(<MarkdownRenderer content="" />);
    expect(toJSON()).toBeTruthy();
  });

  it("renders markdown headings", () => {
    render(<MarkdownRenderer content="# Heading One" />);
    expect(JSON.stringify(screen.toJSON())).toContain("Heading One");
  });

  it("renders unordered list items", () => {
    render(<MarkdownRenderer content="- item one\n- item two" />);
    const json = JSON.stringify(screen.toJSON());
    expect(json).toContain("item one");
    expect(json).toContain("item two");
  });

  it("accepts optional className prop without crash", () => {
    const { toJSON } = render(<MarkdownRenderer content="Hello" className="custom-class" />);
    expect(toJSON()).toBeTruthy();
  });
});
