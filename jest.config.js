module.exports = {
  preset: "jest-expo/web",
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-native/.*)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|nativewind|react-native-css-interop|@opencode-ai/.*)",
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@opencode-ai/sdk/v2/client$": "<rootDir>/node_modules/@opencode-ai/sdk/dist/v2/client.js",
  },
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
};
