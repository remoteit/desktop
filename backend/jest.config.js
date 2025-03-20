module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: ['node_modules', 'build', 'dist'],
  moduleNameMapper: {
    '^@common/(.*)$': '<rootDir>/../common/src/$1',
  },
  setupFiles: ['<rootDir>/jest.setup.js'],
}
