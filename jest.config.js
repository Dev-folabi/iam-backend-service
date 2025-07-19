export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'js', 'json'],
  testMatch: ['**/tests/**/*.test.ts'],
  clearMocks: true,
  setupFilesAfterEnv: ['<rootDir>/tests/setupTestDB.ts'],
};
