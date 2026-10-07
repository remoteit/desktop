module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: ['node_modules', 'build', 'dist'],
  moduleNameMapper: {
    '^@common/(.*)$': '<rootDir>/../../../common/src/$1',
  },
  globalSetup: '<rootDir>/jest.globalSetup.js',
  setupFiles: ['<rootDir>/jest.setup.js'],
}
