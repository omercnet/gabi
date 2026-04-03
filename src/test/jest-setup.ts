import { Dimensions } from "react-native";

// Default to desktop dimensions in tests so useIsMobile() returns false.
// Individual tests can override via jest.spyOn or jest.mock.
jest.spyOn(Dimensions, "get").mockReturnValue({
  width: 1024,
  height: 768,
  scale: 1,
  fontScale: 1,
});
