module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/scripts/**/*.test.js',
    '<rootDir>/features/**/*.test.ts',
    '<rootDir>/db/**/*.test.js',
  ],
  transform: {
    '^.+\\.mjs$': 'babel-jest',
    '^.+\\.(ts|tsx)$': 'babel-jest',
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};
