module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: ['node_modules', 'build', 'dist'],
  moduleNameMapper: {
    '^@common/(.*)$': '<rootDir>/../../../common/src/$1',
  },
  globalSetup: '<rootDir>/jest.globalSetup.js',
  globalTeardown: '<rootDir>/jest.globalTeardown.js',
  setupFiles: ['<rootDir>/jest.setup.js'],
}
