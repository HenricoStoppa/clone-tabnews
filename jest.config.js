const nextJest = require("next/jest");
const dotenv = require("dotenv");
dotenv.config({ path: ".env.development" });

const createJestConfig = nextJest();
const jestConfig = createJestConfig({
  moduleDirectories: ["node_modules", "<rootDir>"],
  testTimeout: 60000,
  watchPathIgnorePatterns: ["infra/migrations/.*dummy-migration.js"],
});

module.exports = jestConfig;
