import { performance } from 'perf_hooks';

// Global performance monitoring setup
(global as any).performance = performance;

// Extend Jest matchers for performance testing
expect.extend({
  toBeFasterThan(received: number, expected: number) {
    const pass = received < expected;
    if (pass) {
      return {
        message: () => `Expected ${received}ms to be slower than ${expected}ms`,
        pass: true,
      };
    } else {
      return {
        message: () => `Expected ${received}ms to be faster than ${expected}ms`,
        pass: false,
      };
    }
  },

  toHaveReasonableMemoryUsage(received: NodeJS.MemoryUsage, maxHeapMB: number = 100) {
    const heapUsedMB = received.heapUsed / (1024 * 1024);
    const pass = heapUsedMB < maxHeapMB;

    if (pass) {
      return {
        message: () => `Expected memory usage ${heapUsedMB.toFixed(2)}MB to exceed ${maxHeapMB}MB`,
        pass: true,
      };
    } else {
      return {
        message: () => `Expected memory usage ${heapUsedMB.toFixed(2)}MB to be less than ${maxHeapMB}MB`,
        pass: false,
      };
    }
  },

  toHaveGoodThroughput(received: number, minRecordsPerSecond: number = 10) {
    const pass = received >= minRecordsPerSecond;

    if (pass) {
      return {
        message: () => `Expected throughput ${received} records/sec to be less than ${minRecordsPerSecond} records/sec`,
        pass: true,
      };
    } else {
      return {
        message: () => `Expected throughput ${received} records/sec to be at least ${minRecordsPerSecond} records/sec`,
        pass: false,
      };
    }
  }
});

// Performance monitoring utilities
global.measurePerformance = async <T>(
  operation: () => Promise<T>,
  label: string
): Promise<{ result: T; duration: number; memory: NodeJS.MemoryUsage }> => {
  const startMemory = process.memoryUsage();
  const startTime = performance.now();

  const result = await operation();

  const endTime = performance.now();
  const endMemory = process.memoryUsage();
  const duration = endTime - startTime;

  console.log(`⏱️  ${label}: ${duration.toFixed(2)}ms`);

  return {
    result,
    duration,
    memory: {
      rss: endMemory.rss - startMemory.rss,
      heapTotal: endMemory.heapTotal - startMemory.heapTotal,
      heapUsed: endMemory.heapUsed - startMemory.heapUsed,
      external: endMemory.external - startMemory.external,
      arrayBuffers: endMemory.arrayBuffers - startMemory.arrayBuffers
    }
  };
};

// Performance test helpers
global.createPerformanceDataset = (size: 'small' | 'medium' | 'large') => {
  const sizes = {
    small: { proprietaires: 10, immeubles: 5, locataires: 50, lots: 80 },
    medium: { proprietaires: 25, immeubles: 15, locataires: 200, lots: 400 },
    large: { proprietaires: 50, immeubles: 25, locataires: 500, lots: 800 }
  };

  return sizes[size];
};

// Global test timeout for performance tests
jest.setTimeout(300000); // 5 minutes

// Memory leak detection
let initialMemory: NodeJS.MemoryUsage;

beforeAll(() => {
  initialMemory = process.memoryUsage();
  console.log('🔍 Initial memory usage:', {
    heapUsed: `${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`,
    heapTotal: `${(initialMemory.heapTotal / 1024 / 1024).toFixed(2)}MB`
  });
});

afterAll(() => {
  const finalMemory = process.memoryUsage();
  const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
  const memoryIncreaseMB = memoryIncrease / (1024 * 1024);

  console.log('📊 Final memory usage:', {
    heapUsed: `${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`,
    increase: `${memoryIncreaseMB.toFixed(2)}MB`
  });

  // Warn if memory usage increased significantly
  if (memoryIncreaseMB > 50) {
    console.warn(`⚠️  Memory usage increased by ${memoryIncreaseMB.toFixed(2)}MB - potential memory leak`);
  }
});

// Declare global types for TypeScript
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeFasterThan(expected: number): R;
      toHaveReasonableMemoryUsage(maxHeapMB?: number): R;
      toHaveGoodThroughput(minRecordsPerSecond?: number): R;
    }
  }

  var measurePerformance: <T>(
    operation: () => Promise<T>,
    label: string
  ) => Promise<{ result: T; duration: number; memory: NodeJS.MemoryUsage }>;

  var createPerformanceDataset: (size: 'small' | 'medium' | 'large') => {
    proprietaires: number;
    immeubles: number;
    locataires: number;
    lots: number;
  };
}