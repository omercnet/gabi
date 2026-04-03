import { useColorScheme } from "react-native";

/**
 * Returns the appropriate placeholder text color for the current color scheme.
 * Uses the muted token values from global.css:
 * - Light: rgb(115, 115, 115)  →  #737373
 * - Dark:  rgb(113, 113, 122)  →  #71717a
 */
export function usePlaceholderColor(): string {
  const colorScheme = useColorScheme();
  return colorScheme === "dark" ? "#71717a" : "#737373";
}
