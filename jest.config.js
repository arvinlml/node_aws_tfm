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
  reporters: [
    'default',
    [
      'jest-allure',
      {
        outputPath: 'allure-results',
        usePackageJsonReporter: false,
        usePath: true,
        suiteTitle: true,
        disableWebdriverStepsReporting: true,
        disableWebdriverScreenshotsReporting: true,
        issueLinkTemplate: 'https://github.com/arvinlml/node_aws_tfm/issues/{}',
        tmsLinkTemplate: 'https://jira.example.com/browse/{}'
      }
    ]
  ],
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
