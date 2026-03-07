/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  testEnvironment: "node",
  transform: {
    "^.+\\.(ts|tsx)$": ["ts-jest", {}],
    "^.+\\.(js|jsx|mjs)$": "babel-jest",
  },
  transformIgnorePatterns: [
    "/node_modules/(?!(@inquirer|yoctocolors|ansi-escapes|cli-width|fast-wrap-ansi|fast-string-width|fast-string-truncated-width|strip-ansi|ansi-regex)/).*/"
  ],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
};