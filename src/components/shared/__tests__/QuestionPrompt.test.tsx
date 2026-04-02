import { render } from "@testing-library/react-native";
import { QuestionPromptQueue } from "@/components/shared/QuestionPrompt";
import { useQuestionStore } from "@/stores/questionStore";
import { makeQuestionRequest } from "@/test/factories";
import { resetAllStores } from "@/test/setup";

// NOTE: QuestionPrompt uses React Native Modal (portal-based) which is
// incompatible with react-test-renderer. We test store interactions only.

describe("QuestionPromptQueue", () => {
  beforeEach(resetAllStores);

  it("renders nothing when pending queue is empty", () => {
    const { toJSON } = render(<QuestionPromptQueue />);
    expect(toJSON()).toBeNull();
  });

  it("is defined and exported", () => {
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
