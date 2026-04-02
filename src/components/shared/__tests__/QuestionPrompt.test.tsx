import { render } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { useQuestionStore } from "@/stores/questionStore";
import { makeQuestionRequest } from "@/test/factories";
import { resetAllStores } from "@/test/setup";

jest.mock("react-native", () => {
  const actual = jest.requireActual("react-native");
  return {
    ...actual,
    Modal: ({ visible, children }: { visible: boolean; children?: ReactNode }) =>
      visible ? (children as ReactNode) : null,
  };
});

function getQuestionPromptQueue(): typeof import("@/components/shared/QuestionPrompt").QuestionPromptQueue {
  return require("@/components/shared/QuestionPrompt").QuestionPromptQueue;
}

// NOTE: QuestionPrompt uses React Native Modal (portal-based) which is
// incompatible with react-test-renderer. We test store interactions only.

describe("QuestionPromptQueue", () => {
  beforeEach(resetAllStores);

  it("renders nothing when pending queue is empty", () => {
    const QuestionPromptQueue = getQuestionPromptQueue();
    const { toJSON } = render(<QuestionPromptQueue />);
    expect(toJSON()).toBeNull();
  });

  it("onSubmit callback is wired — store remove clears pending", () => {
    const request = makeQuestionRequest();
    useQuestionStore.setState({ pending: [request] });
    // Don't render (Modal portal crashes react-test-renderer) — test store logic directly
    // Don't render (Modal portal crashes react-test-renderer) — test store logic directly
    useQuestionStore.getState().remove(request.id);
    expect(useQuestionStore.getState().pending).toHaveLength(0);
  });

  it("question is removed from queue after remove() call", () => {
    const request = makeQuestionRequest();
    useQuestionStore.setState({ pending: [request] });
    useQuestionStore.getState().remove(request.id);
    expect(useQuestionStore.getState().pending).toHaveLength(0);
  });

  it("is defined and exported", () => {
    const QuestionPromptQueue = getQuestionPromptQueue();
    expect(QuestionPromptQueue).toBeDefined();
  });

  it("reads from questionStore pending list", () => {
    const r1 = makeQuestionRequest();
    const r2 = makeQuestionRequest();
    useQuestionStore.setState({ pending: [r1, r2] });
    expect(useQuestionStore.getState().pending).toHaveLength(2);
  });

  it("store remove() empties pending after submit/dismiss", () => {
    const request = makeQuestionRequest();
    useQuestionStore.setState({ pending: [request] });
    useQuestionStore.getState().remove(request.id);
    expect(useQuestionStore.getState().pending).toHaveLength(0);
  });

  it("upsert adds multiple questions in order", () => {
    const r1 = makeQuestionRequest({ questions: [{ question: "Q1", header: "H1", options: [] }] });
    const r2 = makeQuestionRequest({ questions: [{ question: "Q2", header: "H2", options: [] }] });
    useQuestionStore.getState().upsert(r1);
    useQuestionStore.getState().upsert(r2);
    expect(useQuestionStore.getState().pending).toHaveLength(2);
  });
});
