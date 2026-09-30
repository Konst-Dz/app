module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/scripts/**/*.test.js'],
  transform: {
    '^.+\\.mjs$': 'babel-jest',
  },
};
