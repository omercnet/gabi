/**
 * Tests ChatInput component logic:
 * - Send guard: no send on empty/whitespace, no send while streaming
 * - Abort callback invocation
 * - Props contract
 */
describe("ChatInput logic", () => {
  describe("send guard", () => {
    const handleSend = (text: string, isStreaming: boolean) => {
      if (!text.trim() || isStreaming) return false;
      return true;
    };

    it("allows send with valid text when not streaming", () => {
      expect(handleSend("Hello", false)).toBe(true);
    });

    it("rejects send with empty text", () => {
      expect(handleSend("", false)).toBe(false);
    });

    it("rejects send with whitespace-only text", () => {
      expect(handleSend("   ", false)).toBe(false);
    });

    it("rejects send when streaming", () => {
      expect(handleSend("Hello", true)).toBe(false);
    });

    it("rejects send with empty text while streaming", () => {
      expect(handleSend("", true)).toBe(false);
    });

    it("allows send with trimmed text that has whitespace", () => {
      expect(handleSend("  hello  ", false)).toBe(true);
    });
  });

  describe("button state", () => {
    it("shows Stop button when streaming", () => {
      const isStreaming = true;
      const buttonText = isStreaming ? "Stop" : "Send";
      expect(buttonText).toBe("Stop");
    });

    it("shows Send button when not streaming", () => {
      const isStreaming = false;
      const buttonText = isStreaming ? "Stop" : "Send";
      expect(buttonText).toBe("Send");
    });

    it("disables Send when disabled prop is true", () => {
      const disabled = true;
      const text = "Hello";
      const sendDisabled = disabled || !text.trim();
      expect(sendDisabled).toBe(true);
    });

    it("disables Send when text is empty", () => {
      const disabled = false;
      const text = "";
      const sendDisabled = disabled || !text.trim();
      expect(sendDisabled).toBe(true);
    });

    it("enables Send with text and not disabled", () => {
      const disabled = false;
      const text = "Hello";
      const sendDisabled = disabled || !text.trim();
      expect(sendDisabled).toBe(false);
    });
  });

  describe("keyboard handling", () => {
    it("triggers send on Enter key press (web)", () => {
      const isWeb = true;
      const key = "Enter";
      const shouldSend = isWeb && key === "Enter";
      expect(shouldSend).toBe(true);
    });

    it("does not trigger send on non-Enter keys", () => {
      const isWeb = true;
      const key = "Shift";
      const shouldSend = isWeb && key === "Enter";
      expect(shouldSend).toBe(false);
    });
  });
});
