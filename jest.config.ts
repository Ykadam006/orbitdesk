import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
  testEnvironment: "jsdom",
  setupFiles: ["<rootDir>/tests/api-setup.ts"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts", "<rootDir>/tests/components/setup.tsx"],
  moduleNameMapper: {
    "^@/lib/prisma$": "<rootDir>/tests/__mocks__/prisma.ts",
    "^@/lib/auth$": "<rootDir>/tests/__mocks__/auth.ts",
    "^@/app/generated/prisma/client$": "<rootDir>/tests/__mocks__/prismaClient.ts",
    "^@/(.*)$": "<rootDir>/$1",
  },
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.json",
        jsx: "react-jsx",
      },
    ],
  },
  testPathIgnorePatterns: ["/node_modules/", "/.next/", "/tests/e2e/"],
  modulePathIgnorePatterns: ["<rootDir>/.next/"],
  collectCoverageFrom: [
    "lib/**/*.ts",
    "app/api/**/*.ts",
    "components/**/*.tsx",
    "store/**/*.ts",
    "!**/node_modules/**",
    "!**/*.d.ts",
  ],
};

export default config;
