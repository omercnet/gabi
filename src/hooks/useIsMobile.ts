import { useWindowDimensions } from "react-native";

/** Returns true when viewport width is below the 768px tablet breakpoint. */
export function useIsMobile(): boolean {
  const { width } = useWindowDimensions();
  return width < 768;
}
