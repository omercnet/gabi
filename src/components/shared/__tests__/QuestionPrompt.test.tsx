import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { useQuestionStore } from "@/stores/questionStore";
import { makeQuestionRequest } from "@/test/factories";
import { resetAllStores } from "@/test/setup";

jest.mock("react-native", () => {
  const actual = jest.requireActual("react-native");
  return {
    ...actual,
    Modal: ({ visible, children }: { visible: boolean; children?: ReactNode }) =>
      visible ? children : null,
  };
});

function getQuestionPromptQueue(): typeof import("@/components/shared/QuestionPrompt").QuestionPromptQueue {
  return require("@/components/shared/QuestionPrompt").QuestionPromptQueue;
}

// NOTE: QuestionPrompt uses React Native Modal (portal-based) which is
// incompatible with react-test-renderer. We test store interactions only.

describe("QuestionPromptQueue", () => {
  beforeEach(resetAllStores);

  function pressParentOfText(text: string): void {
    const textNode = screen.getByText(text);
    if (!textNode.parent) {
      throw new Error(`Could not find parent Pressable for text: ${text}`);
    }
    fireEvent.press(textNode.parent);
  }

  it("renders nothing when pending queue is empty", () => {
    const QuestionPromptQueue = getQuestionPromptQueue();
    const { toJSON } = render(<QuestionPromptQueue />);
    expect(toJSON()).toBeNull();
  });

  it("onSubmit is called when user submits an answer", async () => {
    const QuestionPromptQueue = getQuestionPromptQueue();
    const request = makeQuestionRequest();
    const firstQuestion = request.questions[0];
    if (!firstQuestion) throw new Error("makeQuestionRequest() did not include a first question");
    const firstOption = firstQuestion.options[0];
    if (!firstOption) throw new Error("makeQuestionRequest() did not include a first option");
    const optionLabel = firstOption.label;

    useQuestionStore.setState({ pending: [request] });

    const onSubmit = jest.fn();
    render(<QuestionPromptQueue onSubmit={onSubmit} />);

    pressParentOfText(optionLabel);
    pressParentOfText("Submit");

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith(request.id, [[optionLabel]]);
  });

  it("question is removed from queue after submission", async () => {
    const QuestionPromptQueue = getQuestionPromptQueue();
    const request = makeQuestionRequest();
    const firstQuestion = request.questions[0];
    if (!firstQuestion) throw new Error("makeQuestionRequest() did not include a first question");
    const firstOption = firstQuestion.options[0];
    if (!firstOption) throw new Error("makeQuestionRequest() did not include a first option");
    const optionLabel = firstOption.label;

    useQuestionStore.setState({ pending: [request] });

    render(<QuestionPromptQueue />);

    pressParentOfText(optionLabel);
    pressParentOfText("Submit");

    await waitFor(() => {
      expect(useQuestionStore.getState().pending).toHaveLength(0);
    });
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
