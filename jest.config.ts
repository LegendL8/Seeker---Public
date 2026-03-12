/** @type {import('jest').Config} */
export default {
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  setupFiles: ['<rootDir>/jest.setup.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { useESM: false }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
  roots: ['<rootDir>/server', '<rootDir>/src'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
