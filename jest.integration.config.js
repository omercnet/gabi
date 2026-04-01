/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  testMatch: ["**/src/__integration__/**/*.test.ts"],
  transformIgnorePatterns: [],
  transform: {
    "^.+\\.[jt]sx?$": [
      "babel-jest",
      {
        presets: [
          ["@babel/preset-env", { targets: { node: "current" } }],
          "@babel/preset-typescript",
        ],
      },
    ],
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@opencode-ai/sdk$": "<rootDir>/node_modules/@opencode-ai/sdk/dist/index.js",
    "^@opencode-ai/sdk/client$": "<rootDir>/node_modules/@opencode-ai/sdk/dist/v2/client.js",
    "^@opencode-ai/sdk/v2/client$": "<rootDir>/node_modules/@opencode-ai/sdk/dist/v2/client.js",
  },
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
  forceExit: true,
};
