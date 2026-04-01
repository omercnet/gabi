export type {
  AgentPart,
  AssistantMessage,
  CompactionPart,
  EventFileEdited,
  EventFileWatcherUpdated,
  EventMessagePartDelta,
  EventMessagePartRemoved,
  EventMessagePartUpdated,
  EventMessageRemoved,
  EventMessageUpdated,
  EventPermissionAsked,
  EventPermissionReplied,
  EventProjectUpdated,
  EventQuestionAsked,
  EventQuestionRejected,
  EventQuestionReplied,
  EventSessionCompacted,
  EventSessionDiff,
  EventSessionError,
  EventSessionIdle,
  EventSessionStatus,
  EventTodoUpdated,
  EventVcsBranchUpdated,
  FileDiff,
  FilePart,
  Message,
  Part,
  PatchPart,
  PermissionAction,
  PermissionRequest,
  PermissionRule,
  PermissionRuleset,
  Project,
  QuestionAnswer,
  QuestionInfo,
  QuestionOption,
  QuestionRequest,
  ReasoningPart,
  RetryPart,
  Session,
  SessionStatus,
  SnapshotPart,
  StepFinishPart,
  StepStartPart,
  SubtaskPart,
  TextPart,
  Todo,
  ToolPart,
  UserMessage,
} from "@opencode-ai/sdk/v2/client";

export type { OpencodeClient, OpencodeClientConfig } from "@opencode-ai/sdk/v2/client";

export type SSEStatus = "connected" | "reconnecting" | "disconnected";

import type {
  EventMessagePartDelta as _EventMessagePartDelta,
  EventMessagePartUpdated as _EventMessagePartUpdated,
  EventMessagePartRemoved as _EventMessagePartRemoved,
  EventMessageUpdated as _EventMessageUpdated,
  EventMessageRemoved as _EventMessageRemoved,
  EventSessionStatus as _EventSessionStatus,
  EventSessionIdle as _EventSessionIdle,
  EventSessionCompacted as _EventSessionCompacted,
  EventSessionError as _EventSessionError,
  EventSessionDiff as _EventSessionDiff,
  EventPermissionAsked as _EventPermissionAsked,
  EventPermissionReplied as _EventPermissionReplied,
  EventQuestionAsked as _EventQuestionAsked,
  EventQuestionReplied as _EventQuestionReplied,
  EventQuestionRejected as _EventQuestionRejected,
  EventProjectUpdated as _EventProjectUpdated,
  EventFileEdited as _EventFileEdited,
  EventFileWatcherUpdated as _EventFileWatcherUpdated,
  EventTodoUpdated as _EventTodoUpdated,
  EventVcsBranchUpdated as _EventVcsBranchUpdated,
} from "@opencode-ai/sdk/v2/client";

export type SSEEvent =
  | _EventMessagePartDelta
  | _EventMessagePartUpdated
  | _EventMessagePartRemoved
  | _EventMessageUpdated
  | _EventMessageRemoved
  | _EventSessionStatus
  | _EventSessionIdle
  | _EventSessionCompacted
  | _EventSessionError
  | _EventSessionDiff
  | _EventPermissionAsked
  | _EventPermissionReplied
  | _EventQuestionAsked
  | _EventQuestionReplied
  | _EventQuestionRejected
  | _EventProjectUpdated
  | _EventFileEdited
  | _EventFileWatcherUpdated
  | _EventTodoUpdated
  | _EventVcsBranchUpdated;
