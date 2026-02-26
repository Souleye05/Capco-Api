module.exports = {
  displayName: 'Performance Tests',
  testMatch: ['<rootDir>/src/**/*.performance.spec.ts'],
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/test/setup-performance.ts'],
  testTimeout: 300000, // 5 minutes for performance tests
  maxWorkers: 1, // Run performance tests sequentially
  collectCoverage: false, // Disable coverage for performance tests
  verbose: true,
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  moduleNameMapping: {
    '^../src/(.*)$': '<rootDir>/src/$1',
  },
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: './performance-reports',
        outputName: 'performance-results.xml',
        suiteName: 'Immobilier Performance Tests'
      }
    ]
  ],
  // Performance test specific configuration
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json'
    },
    // Performance thresholds
    PERFORMANCE_THRESHOLDS: {
      UNPAID_DETECTION_SMALL: 500,
      UNPAID_DETECTION_MEDIUM: 1500,
      UNPAID_DETECTION_LARGE: 3000,
      STATISTICS_CALCULATION: 2000,
      EXCEL_IMPORT_SMALL: 1000,
      EXCEL_IMPORT_MEDIUM: 5000,
      EXCEL_IMPORT_LARGE: 15000,
      QUERY_RESPONSE: 200,
      PAGINATION_RESPONSE: 300
    }
  }
};