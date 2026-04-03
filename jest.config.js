module.exports = {
  preset: "jest-expo/web",
  transformIgnorePatterns: [],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@opencode-ai/sdk/v2/client$": "<rootDir>/node_modules/@opencode-ai/sdk/dist/v2/client.js",
    "^@expo/vector-icons/Feather$": "<rootDir>/src/test/__mocks__/expo-vector-icons.tsx",
    "^@expo/vector-icons$": "<rootDir>/src/test/__mocks__/expo-vector-icons.tsx",
  },
  testPathIgnorePatterns: ["/node_modules/", "/dist/", "__integration__"],
  setupFiles: ["<rootDir>/src/test/jest-setup.ts"],
};
