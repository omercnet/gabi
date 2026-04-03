import { cn } from "@/lib/cn";

describe("cn utility", () => {
  it("returns a single class string unchanged", () => {
    expect(cn("foo")).toBe("foo");
  });

  it("merges multiple class strings with a space", () => {
    expect(cn("a", "b", "c")).toBe("a b c");
  });

  it("ignores falsy values (false)", () => {
    expect(cn("a", false, "c")).toBe("a c");
  });

  it("ignores undefined and null", () => {
    expect(cn("a", undefined, null as never, "b")).toBe("a b");
  });

  it("resolves tailwind conflicts — later class wins", () => {
    // twMerge: p-4 wins over p-2
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("returns empty string for no arguments", () => {
    expect(cn()).toBe("");
  });

  it("handles object syntax — includes truthy keys only", () => {
    expect(cn({ active: true, inactive: false })).toBe("active");
  });

  it("merges classes from arrays", () => {
    expect(cn(["a", "b"], "c")).toBe("a b c");
  });
});
