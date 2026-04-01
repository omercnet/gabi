# Learnings — gabi-mvp

## Global Rules (from plan)
1. NativeWind v4: className prop directly, never styled() HOC
2. Zustand v5: `import { create } from "zustand"` (named, no default)
3. SDK: always `@opencode-ai/sdk/v2/client` (v2 API)
4. Dark mode: every className needs base + `dark:` variant
5. Path alias: `@/*` -> `src/*`, never relative cross-directory imports
6. No `.expo/` or `dist/` imports, always use `src/`

## Component Patterns
- All components use NativeWind className, no StyleSheet
- cn() utility available from `@/utils/cn` for conditional classes
- View/Text/Pressable from react-native (NOT div/span/button)
- Platform-specific files: `.web.tsx` / `.native.tsx` extensions
- Colors: bg-surface, bg-background, text-foreground, text-muted, bg-primary, text-primary-foreground
- Status: bg-success, bg-warning, bg-error
- Dark mode variants required on every color class

## Store Patterns
- Zustand v5, `create<State>()((set, get) => ...)`
- No default exports, named exports only
- Stores reset in `resetAllStores()` in `src/test/setup.ts`

## Test Patterns
- jest-expo/web preset, `@testing-library/react-native`
- Tests in `src/components/chat/__tests__/*.test.tsx`
- `renderWithProviders` wrapper if needed, or direct `render` from RNTL
- All stores are reset via `beforeEach(resetAllStores)`
- Mock pattern: `jest.mock('@/stores/xyz', () => ({ useXyzStore: jest.fn() }))`

## Already Installed Packages
- react-markdown@10, remark-gfm@4, react-native-markdown-display@7
- react-syntax-highlighter@16, expo-clipboard@55
- @react-navigation/drawer@7, react-native-gesture-handler@2
- @gorhom/bottom-sheet@5

## Branch
- Feature branch: `feat/mvp-ui-components`
- Create PRs from this branch to main

## Key Files
- PartRenderer: `src/components/chat/PartRenderer.tsx` (wire MarkdownRenderer here)
- ProjectSidebar: `src/components/project/ProjectSidebar.tsx` (wire ConnectionStatus here)
- ChatScreen: `app/(app)/[sessionId]/index.tsx` (wire PermissionPrompt+QuestionPrompt)
- AppLayout: `app/(app)/_layout.tsx` (wire Toast, Drawer)
- ConnectionStore sseStatus: "connected" | "reconnecting" | "disconnected"
- PermissionStore: `usePermissionStore` → `.pending: PermissionRequest[]`
- QuestionStore: `useQuestionStore` → `.pending: QuestionRequest[]`

## [2026-04-01] T7-B/C/D: Markdown Components
- Created MarkdownRenderer.web.tsx (react-markdown + remark-gfm, CodeBlock for fenced code)
- Created MarkdownRenderer.native.tsx (react-native-markdown-display, custom rules for fence/code_block)
- Created CodeBlock.tsx (expo-clipboard copy, horizontal ScrollView, SyntaxHighlighter with require() try/catch)
- Created src/components/shared/index.ts barrel exporting CodeBlock + MarkdownRenderer.web
- exactOptionalPropertyTypes=true: must use conditional spread {...(x ? { prop: x } : {})} not prop={x || undefined}
- ASTNode from react-native-markdown-display needs (node as unknown) as Record<string, unknown> to access .info
- nursery/useSortedClasses warnings are non-blocking (nursery = unstable biome rule)
## 2026-04-01T22:07:58Z T8-A/B T9-A-E T10-C: Polish Components
- Created: PermissionPrompt, QuestionPrompt, ConnectionStatus, ErrorBoundary, EmptyState, Skeleton, Toast, AddProjectSheet

## 2026-04-01 Wire Shared Components into Screens
- Biome enforces strict import ordering: external (expo-router, react, react-native) then @/ aliases alphabetically
- When removing a store subscription (sseStatus), also remove the store import if no other usage
- When adding imports to existing files, insert at correct alphabetical position to avoid biome organizeImports errors
- AppLayout mobile drawer: absolute positioning with bg-black/50 backdrop + pressable to close
- ChatScreen: PermissionPromptQueue + QuestionPromptQueue go OUTSIDE KeyboardAvoidingView (they're overlays)
- Extra blank lines between variable blocks trigger biome format errors
