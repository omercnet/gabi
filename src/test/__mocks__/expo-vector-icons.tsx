import { Text } from "react-native";

/**
 * Mock for @expo/vector-icons/Feather in test environment.
 * Renders a simple Text node with the icon name for assertion purposes.
 */
function MockFeather({
  name,
  size,
  ...rest
}: { name: string; size?: number } & Record<string, unknown>) {
  return <Text {...rest}>{name}</Text>;
}

MockFeather.glyphMap = {} as Record<string, number>;
MockFeather.font = {};

export default MockFeather;
