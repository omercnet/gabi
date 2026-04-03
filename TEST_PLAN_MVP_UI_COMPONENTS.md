# Comprehensive Test Plan for feat/mvp-ui-components Branch

## Branch Overview
- **Current Branch**: feat/mvp-ui-components
- **Base**: main
- **Total Commits**: 5
- **Files Changed**: 30 (11 modified, 19 new)
- **Lines Added**: ~1900

## Commits in Order
1. `0daeac3` - feat: add markdown rendering, permission prompts, polish components, mobile drawer
2. `b62bd09` - test: add tests for all new components in pr 4
3. `d58e356` - fix: address copilot review feedback on pr 4 components
4. `06b5b47` - fix: address copilot review feedback round 2
5. `8d2e6d3` - fix: use result.stream from sdk sse subscribe so events actually flow

---

## NEW COMPONENTS (19 files) - REQUIRE FULL TEST COVERAGE

### Shared UI Components (10 new components + tests)

#### 1. **MarkdownRenderer** (Platform-specific)
- **Files**: 
  - `src/components/shared/MarkdownRenderer.web.tsx` (141 lines)
  - `src/components/shared/MarkdownRenderer.native.tsx` (151 lines)
  - `src/components/shared/__tests__/MarkdownRenderer.test.tsx` (62 lines)
- **Feature**: Renders markdown content with platform-specific implementations
- **Test Coverage Needed**:
  - Markdown syntax rendering (bold, italic, links, code blocks)
  - Platform-specific behavior (web vs native)
  - Edge cases (empty content, malformed markdown)

#### 2. **CodeBlock**
- **Files**:
  - `src/components/shared/CodeBlock.tsx` (122 lines)
  - `src/components/shared/__tests__/CodeBlock.test.tsx` (85 lines)
- **Feature**: Syntax-highlighted code block component
- **Test Coverage Needed**:
  - Language detection
  - Syntax highlighting
  - Copy-to-clipboard functionality
  - Line numbers display

#### 3. **PermissionPrompt**
- **Files**:
  - `src/components/shared/PermissionPrompt.tsx` (102 lines)
  - `src/components/shared/__tests__/PermissionPrompt.test.tsx` (46 lines)
- **Feature**: Modal for requesting user permissions
- **Test Coverage Needed**:
  - Allow/Deny button interactions
  - Permission description display
  - Queue management (PermissionPromptQueue)

#### 4. **QuestionPrompt**
- **Files**:
  - `src/components/shared/QuestionPrompt.tsx` (147 lines)
  - `src/components/shared/__tests__/QuestionPrompt.test.tsx` (43 lines)
- **Feature**: Interactive form for answering questions
- **Test Coverage Needed**:
  - Form field rendering
  - Input validation
  - Submit/Dismiss actions
  - Queue management (QuestionPromptQueue)

#### 5. **ConnectionStatus**
- **Files**:
  - `src/components/shared/ConnectionStatus.tsx` (74 lines)
  - `src/components/shared/__tests__/ConnectionStatus.test.tsx` (55 lines)
- **Feature**: Visual indicator for SSE connection status
- **Test Coverage Needed**:
  - Status states (connected, reconnecting, disconnected)
  - Size variants (sm, md, lg)
  - Color/icon changes per status

#### 6. **ErrorBoundary**
- **Files**:
  - `src/components/shared/ErrorBoundary.tsx` (63 lines)
  - `src/components/shared/__tests__/ErrorBoundary.test.tsx` (78 lines)
- **Feature**: Error boundary for catching React errors
- **Test Coverage Needed**:
  - Error catching and display
  - Reset functionality
  - Fallback UI rendering

#### 7. **Toast**
- **Files**:
  - `src/components/shared/Toast.tsx` (95 lines)
  - `src/components/shared/__tests__/Toast.test.tsx` (111 lines)
- **Feature**: Toast notification system (SSEToast)
- **Test Coverage Needed**:
  - Toast display/dismiss
  - Auto-dismiss timing
  - Multiple toast queue
  - Toast types (success, error, info)

#### 8. **Skeleton**
- **Files**:
  - `src/components/shared/Skeleton.tsx` (74 lines)
  - `src/components/shared/__tests__/Skeleton.test.tsx` (59 lines)
- **Feature**: Loading skeleton placeholder
- **Test Coverage Needed**:
  - Skeleton animation
  - Size/shape variants
  - Responsive behavior

#### 9. **EmptyState**
- **Files**:
  - `src/components/shared/EmptyState.tsx` (37 lines)
  - `src/components/shared/__tests__/EmptyState.test.tsx` (42 lines)
- **Feature**: Empty state UI component
- **Test Coverage Needed**:
  - Icon/message display
  - Action button rendering
  - Accessibility

#### 10. **AddProjectSheet**
- **Files**:
  - `src/components/project/AddProjectSheet.tsx` (73 lines)
  - `src/components/project/__tests__/AddProjectSheet.test.tsx` (56 lines)
- **Feature**: Modal for adding new projects
- **Test Coverage Needed**:
  - Form input handling
  - Validation
  - Submit/Cancel actions
  - Integration with ProjectSidebar

#### 11. **Shared Index Export**
- **File**: `src/components/shared/index.ts` (11 lines)
- **Feature**: Barrel export for all shared components

---

## MODIFIED FILES (11 files) - REQUIRE REGRESSION TESTING

### 1. **app/(app)/[sessionId]/index.tsx** (35 lines changed)
- **Changes**:
  - Added `PermissionPromptQueue` and `QuestionPromptQueue` imports
  - Added `usePermissions` and `useQuestions` hooks
  - Wrapped content in outer View for proper layout
  - Integrated permission/question prompt queues with callbacks
- **Test Coverage Needed**:
  - Permission prompt integration
  - Question prompt integration
  - Callback handlers (replyPermission, replyQuestion, rejectQuestion)
  - Layout structure with new wrapper View

### 2. **app/(app)/_layout.tsx** (47 lines changed)
- **Changes**:
  - Added mobile drawer state management
  - Responsive layout: wide (sidebar) vs narrow (drawer)
  - Mobile drawer overlay with hamburger menu
  - Added `SSEToast` component
  - Conditional rendering based on window width
- **Test Coverage Needed**:
  - Wide layout (width >= 768px)
  - Narrow layout (width < 768px)
  - Drawer open/close toggle
  - Drawer overlay interaction
  - SSEToast integration
  - Responsive behavior on resize

### 3. **src/client/sse.ts** (11 lines changed)
- **Changes**:
  - Fixed SDK v2 compatibility: extract `stream` from result object
  - Changed from `result.data` to direct event handling
  - Updated type casting to `SSEEvent`
- **Test Coverage Needed**:
  - SDK v2 stream handling
  - Event flow from subscribe
  - Backward compatibility (if needed)
  - Error handling with new stream structure

### 4. **src/components/chat/PartRenderer.tsx** (3 lines changed)
- **Changes**:
  - Replaced plain Text with `MarkdownRenderer` for text parts
  - Integrated markdown rendering into message display
- **Test Coverage Needed**:
  - Markdown rendering in chat messages
  - Text part handling
  - Integration with existing part types

### 5. **src/components/chat/__tests__/PartRenderer.test.tsx** (12 lines changed)
- **Changes**: Updated tests for MarkdownRenderer integration
- **Test Coverage Needed**: Verify test updates match new implementation

### 6. **src/components/project/ProjectSidebar.tsx** (12 lines changed)
- **Changes**:
  - Removed `useConnectionStore` dependency
  - Replaced inline status color logic with `ConnectionStatus` component
  - Simplified status indicator
- **Test Coverage Needed**:
  - ConnectionStatus component integration
  - Status display accuracy
  - Removal of old connection store logic

### 7. **src/client/__tests__/sse.test.ts** (50 lines changed)
- **Changes**: Updated tests for SDK v2 stream handling
- **Test Coverage Needed**: Verify SSE test updates

---

## FEATURE SUMMARY BY CATEGORY

### UI/UX Features
- ✅ Markdown rendering for rich text messages
- ✅ Code block syntax highlighting
- ✅ Toast notifications for SSE events
- ✅ Loading skeletons
- ✅ Empty states
- ✅ Error boundaries

### User Interaction Features
- ✅ Permission prompts (allow/deny)
- ✅ Question prompts (form-based)
- ✅ Mobile drawer navigation
- ✅ Responsive layout (wide/narrow)
- ✅ Connection status indicator

### Integration Features
- ✅ SSE stream handling (SDK v2)
- ✅ Permission/question queue management
- ✅ Markdown in chat messages
- ✅ Project management UI

---

## TEST EXECUTION CHECKLIST

### Unit Tests (Per Component)
- [ ] MarkdownRenderer (web + native)
- [ ] CodeBlock
- [ ] PermissionPrompt
- [ ] QuestionPrompt
- [ ] ConnectionStatus
- [ ] ErrorBoundary
- [ ] Toast
- [ ] Skeleton
- [ ] EmptyState
- [ ] AddProjectSheet

### Integration Tests
- [ ] Chat screen with permission/question prompts
- [ ] App layout responsive behavior
- [ ] SSE stream event flow
- [ ] PartRenderer with markdown
- [ ] ProjectSidebar with ConnectionStatus

### Regression Tests
- [ ] Existing chat functionality
- [ ] Message sending/receiving
- [ ] Project management
- [ ] Session navigation
- [ ] Settings access

### E2E Tests (if applicable)
- [ ] Full chat flow with permissions
- [ ] Mobile drawer navigation
- [ ] Responsive layout switching
- [ ] Toast notifications
- [ ] Error handling

