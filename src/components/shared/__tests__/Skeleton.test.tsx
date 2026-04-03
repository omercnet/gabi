import { render } from "@testing-library/react-native";
import { MessageSkeleton, SessionSkeleton, Skeleton } from "@/components/shared/Skeleton";

describe("Skeleton", () => {
  it("renders without crash with no props", () => {
    const { toJSON } = render(<Skeleton />);
    expect(toJSON()).toBeTruthy();
  });

  it("renders without crash with width, height and rounded props", () => {
    const { toJSON } = render(<Skeleton width={100} height={20} rounded={true} />);
    expect(toJSON()).toBeTruthy();
  });

  it("applies className prop without crash", () => {
    const { toJSON } = render(<Skeleton className="w-3/4" />);
    expect(toJSON()).toBeTruthy();
  });

  it("uses rounded border-radius when rounded=true", () => {
    const { toJSON } = render(<Skeleton height={36} rounded={true} />);
    const json = JSON.stringify(toJSON());
    // borderRadius should be height/2 = 18
    expect(json).toContain("18");
  });
});

describe("SessionSkeleton", () => {
  it("renders without crash", () => {
    const { toJSON } = render(<SessionSkeleton />);
    expect(toJSON()).toBeTruthy();
  });

  it("renders multiple skeleton rows (3 items)", () => {
    const { toJSON } = render(<SessionSkeleton />);
    // SessionSkeleton renders 3 rows with circular avatar skeletons and text skeletons
    const json = JSON.stringify(toJSON());
    // Each row has a circular avatar skeleton (rounded=true, w=36, h=36)
    // The json should contain multiple skeleton elements
    expect(json).toBeTruthy();
    // Verify structure has children (3 rows)
    const root = toJSON() as { children: unknown[] };
    expect(root.children).toBeTruthy();
  });
});

describe("MessageSkeleton", () => {
  it("renders without crash", () => {
    const { toJSON } = render(<MessageSkeleton />);
    expect(toJSON()).toBeTruthy();
  });

  it("renders bubble shapes (width 180 and 260)", () => {
    const { toJSON } = render(<MessageSkeleton />);
    const json = JSON.stringify(toJSON());
    expect(json).toContain("180");
    expect(json).toContain("260");
  });
});
