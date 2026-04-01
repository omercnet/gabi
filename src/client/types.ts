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
  EventSessionCreated,
  EventSessionDeleted,
  EventSessionDiff,
  EventSessionError,
  EventSessionIdle,
  EventSessionStatus,
  EventSessionUpdated,
  EventTodoUpdated,
  EventVcsBranchUpdated,
  FileDiff,
  FilePart,
  Message,
  OpencodeClient,
  OpencodeClientConfig,
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

export type SSEStatus = "connected" | "reconnecting" | "disconnected";

import type {
  EventFileEdited as _EventFileEdited,
  EventFileWatcherUpdated as _EventFileWatcherUpdated,
  EventMessagePartDelta as _EventMessagePartDelta,
  EventMessagePartRemoved as _EventMessagePartRemoved,
  EventMessagePartUpdated as _EventMessagePartUpdated,
  EventMessageRemoved as _EventMessageRemoved,
  EventMessageUpdated as _EventMessageUpdated,
  EventPermissionAsked as _EventPermissionAsked,
  EventPermissionReplied as _EventPermissionReplied,
  EventProjectUpdated as _EventProjectUpdated,
  EventQuestionAsked as _EventQuestionAsked,
  EventQuestionRejected as _EventQuestionRejected,
  EventQuestionReplied as _EventQuestionReplied,
  EventSessionCompacted as _EventSessionCompacted,
  EventSessionCreated as _EventSessionCreated,
  EventSessionDeleted as _EventSessionDeleted,
  EventSessionDiff as _EventSessionDiff,
  EventSessionError as _EventSessionError,
  EventSessionIdle as _EventSessionIdle,
  EventSessionStatus as _EventSessionStatus,
  EventSessionUpdated as _EventSessionUpdated,
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
  | _EventSessionCreated
  | _EventSessionUpdated
  | _EventSessionDeleted
  | _EventProjectUpdated
  | _EventFileEdited
  | _EventFileWatcherUpdated
  | _EventTodoUpdated
  | _EventVcsBranchUpdated;
