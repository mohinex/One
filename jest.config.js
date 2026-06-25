export default {
  preset: "ts-jest",
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { useESM: true }],
  },
  moduleNameMapper: {
    "^(\\.\\.?/.*)\\.ts$": "$1",
  },
  testMatch: ["**/tests/**/*.test.ts"],
};
