const nextJest = require("next/jest");

const createJestConfig = nextJest({ dir: "./" });

module.exports = createJestConfig({
  clearMocks: true,
  testEnvironment: "jsdom",
  testEnvironmentOptions: { customExportConditions: ["node", "node-addons"] },
  modulePathIgnorePatterns: ["<rootDir>/.next/"],
  setupFiles: ["<rootDir>/jest.polyfill.js"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "^msw/node$": "<rootDir>/node_modules/msw/lib/node/index.js",
  },
});
