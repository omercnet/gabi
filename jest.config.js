module.exports = {
  preset: "jest-expo/web",
  transformIgnorePatterns: [],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@opencode-ai/sdk/v2/client$": "<rootDir>/node_modules/@opencode-ai/sdk/dist/v2/client.js",
  },
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
};
