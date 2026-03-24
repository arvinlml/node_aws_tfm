module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/?(*.)+(spec|test).ts'],
  testTimeout: 10000,
  forceExit: true,
  detectOpenHandles: false,
  maxWorkers: 1,
  bail: false,
  verbose: true,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 15,
      lines: 10,
      statements: 10
    }
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  globals: {
    'ts-jest': {
      isolatedModules: true,
      tsconfig: {
        esModuleInterop: true,
        skipLibCheck: true
      }
    }
  }
};
