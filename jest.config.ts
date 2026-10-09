import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({ dir: './' });

const config: Config = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@test/(.*)$': '<rootDir>/test/$1',
  },
  testMatch: [
    '**/__tests__/**/*.test.(ts|tsx)',
    '**/*.test.(ts|tsx)',
    'test/integration/**/*.integration.test.(ts|tsx)',
  ],
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  coverageProvider: 'v8',
};

export default async () => {
  const jestConfig = await createJestConfig(config)();
  // sanitize-html depends on ESM-only htmlparser2. Jest does not transform
  // node_modules unless they are excluded from transformIgnorePatterns.
  const esmDeps = 'sanitize-html|htmlparser2|domhandler|domelementtype|domutils|entities|dom-serializer';
  const patterns = jestConfig.transformIgnorePatterns ?? [];
  jestConfig.transformIgnorePatterns = patterns.map((pattern) =>
    pattern.includes('node_modules')
      ? pattern.replace('node_modules/', `node_modules/(?!(${esmDeps})/)`)
      : pattern,
  );
  if (jestConfig.transformIgnorePatterns.length === patterns.length && patterns.length === 0) {
    jestConfig.transformIgnorePatterns = [`/node_modules/(?!(${esmDeps})/)`];
  }
  return jestConfig;
};
