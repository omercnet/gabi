// Platform-specific implementations: MarkdownRenderer.web.tsx / MarkdownRenderer.native.tsx
// Metro and webpack resolve the correct implementation automatically at build time.
// This file exists solely for TypeScript resolution when no platform suffix matches.

export { MarkdownRenderer } from "./MarkdownRenderer.web";
