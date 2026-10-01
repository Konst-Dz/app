module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/scripts/**/*.test.js',
    '<rootDir>/features/**/*.test.ts',
    '<rootDir>/db/**/*.test.js',
    '<rootDir>/theme/**/*.test.ts',
  ],
  transform: {
    '^.+\\.mjs$': 'babel-jest',
    '^.+\\.(ts|tsx)$': 'babel-jest',
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};
