module.exports = {
  projects: [
    {
      displayName: 'node',
      testEnvironment: 'node',
      testMatch: [
        '<rootDir>/scripts/**/*.test.js',
        '<rootDir>/db/**/*.test.js',
      ],
      transform: {
        '^.+\\.mjs$': 'babel-jest',
        '^.+\\.(ts|tsx)$': 'babel-jest',
      },
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
      },
    },
    {
      displayName: 'rn',
      preset: 'jest-expo',
      testMatch: [
        '<rootDir>/features/**/*.test.{ts,tsx}',
        '<rootDir>/theme/**/*.test.ts',
        '<rootDir>/components/**/*.test.{ts,tsx}',
      ],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
      },
    },
  ],
};
