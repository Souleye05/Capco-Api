import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpException, HttpStatus, ArgumentsHost } from '@nestjs/common';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import { PrismaExceptionFilter } from './filters/prisma-exception.filter';
import {
  PrismaClientKnownRequestError,
  PrismaClientUnknownRequestError,
  PrismaClientValidationError,
} from '@prisma/client/runtime/library';
import * as fc from 'fast-check';

/**
 * Property-Based Tests for Common Module
 * **Property 14: Gestion cohérente des erreurs (Consistent Error Handling)**
 * **Validates: Requirements 7.2**
 */
describe('Common Module - Property-Based Tests', () => {
  let allExceptionsFilter: AllExceptionsFilter;
  let prismaExceptionFilter: PrismaExceptionFilter;
  let configService: ConfigService;
  let mockResponse: any;
  let mockRequest: any;
  let mockHost: ArgumentsHost;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AllExceptionsFilter,
        PrismaExceptionFilter,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              if (key === 'NODE_ENV') return 'test';
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    allExceptionsFilter = module.get<AllExceptionsFilter>(AllExceptionsFilter);
    prismaExceptionFilter = module.get<PrismaExceptionFilter>(PrismaExceptionFilter);
    configService = module.get<ConfigService>(ConfigService);

    // Mock response object
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    // Mock request object
    mockRequest = {
      url: '/test-endpoint',
      method: 'GET',
    };

    // Mock ArgumentsHost
    mockHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: jest.fn().mockReturnValue(mockResponse),
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Property 14.1: Structured Error Response Format', () => {
    /**
     * Property: All errors should return a consistent structured response format
     * regardless of the error type or source
     */
    it('should return consistent error response structure for all error types', async () => {
      const errorGenerator = fc.oneof(
        // HTTP Exceptions
        fc.record({
          type: fc.constant('http'),
          status: fc.constantFrom(400, 401, 403, 404, 409, 422, 500),
          message: fc.string({ minLength: 1, maxLength: 100 }),
        }),
        // Generic Errors
        fc.record({
          type: fc.constant('generic'),
          message: fc.string({ minLength: 1, maxLength: 100 }),
        }),
        // Prisma Known Request Errors
        fc.record({
          type: fc.constant('prisma_known'),
          code: fc.constantFrom('P2000', 'P2001', 'P2002', 'P2003', 'P2025'),
          message: fc.string({ minLength: 1, maxLength: 100 }),
        }),
        // Prisma Validation Errors
        fc.record({
          type: fc.constant('prisma_validation'),
          message: fc.string({ minLength: 1, maxLength: 100 }),
        }),
        // Prisma Unknown Errors
        fc.record({
          type: fc.constant('prisma_unknown'),
          message: fc.string({ minLength: 1, maxLength: 100 }),
        })
      );

      await fc.assert(
        fc.asyncProperty(
          errorGenerator,
          async (errorData) => {
            let exception: any;

            // Create appropriate exception based on type
            switch (errorData.type) {
              case 'http':
                exception = new HttpException(errorData.message, errorData.status);
                break;
              case 'generic':
                exception = new Error(errorData.message);
                break;
              case 'prisma_known':
                exception = new PrismaClientKnownRequestError(
                  errorData.message,
                  {
                    code: errorData.code,
                    clientVersion: '5.0.0',
                    meta: {},
                  }
                );
                break;
              case 'prisma_validation':
                exception = new PrismaClientValidationError(errorData.message, { clientVersion: '5.0.0' });
                break;
              case 'prisma_unknown':
                exception = new PrismaClientUnknownRequestError(errorData.message, { clientVersion: '5.0.0' });
                break;
            }

            // Test with appropriate filter
            if (errorData.type.startsWith('prisma')) {
              prismaExceptionFilter.catch(exception, mockHost);
            } else {
              allExceptionsFilter.catch(exception, mockHost);
            }

            // Verify response structure
            expect(mockResponse.status).toHaveBeenCalledWith(expect.any(Number));
            expect(mockResponse.json).toHaveBeenCalledWith(
              expect.objectContaining({
                statusCode: expect.any(Number),
                timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
                path: expect.any(String),
                method: expect.any(String),
                message: expect.any(String),
              })
            );

            // Verify status code is valid HTTP status
            const statusCall = mockResponse.status.mock.calls[0][0];
            expect(statusCall).toBeGreaterThanOrEqual(400);
            expect(statusCall).toBeLessThan(600);

            // Verify response contains required fields
            const jsonCall = mockResponse.json.mock.calls[0][0];
            expect(jsonCall).toHaveProperty('statusCode');
            expect(jsonCall).toHaveProperty('timestamp');
            expect(jsonCall).toHaveProperty('path');
            expect(jsonCall).toHaveProperty('method');
            expect(jsonCall).toHaveProperty('message');
          }
        ),
        { numRuns: 50, timeout: 10000 }
      );
    }, 15000);
  });

  describe('Property 14.2: Environment-Based Error Detail Levels', () => {
    /**
     * Property: Error responses should contain different levels of detail
     * based on the environment (development vs production)
     */
    it('should provide appropriate error detail levels based on environment', async () => {
      const environmentTestGenerator = fc.record({
        environment: fc.constantFrom('development', 'production', 'test'),
        errorMessage: fc.string({ minLength: 1, maxLength: 100 }),
        includeStack: fc.boolean(),
      });

      await fc.assert(
        fc.asyncProperty(
          environmentTestGenerator,
          async (testData) => {
            // Mock environment
            (configService.get as jest.Mock).mockImplementation((key: string) => {
              if (key === 'NODE_ENV') return testData.environment;
              return undefined;
            });

            // Create a new filter instance with updated config
            const filter = new AllExceptionsFilter(configService);
            
            // Create error with stack trace
            const error = new Error(testData.errorMessage);
            if (testData.includeStack) {
              error.stack = `Error: ${testData.errorMessage}\n    at test (test.js:1:1)`;
            }

            // Test error handling
            filter.catch(error, mockHost);

            const jsonCall = mockResponse.json.mock.calls[0][0];

            if (testData.environment === 'development') {
              // Development should include more details
              expect(jsonCall).toHaveProperty('error');
              if (testData.includeStack) {
                expect(jsonCall).toHaveProperty('stack');
              }
            } else {
              // Production should have minimal details
              expect(jsonCall).not.toHaveProperty('stack');
              // Error field might be present but shouldn't contain sensitive info
            }

            // All environments should have basic error structure
            expect(jsonCall).toHaveProperty('statusCode');
            expect(jsonCall).toHaveProperty('timestamp');
            expect(jsonCall).toHaveProperty('path');
            expect(jsonCall).toHaveProperty('method');
            expect(jsonCall).toHaveProperty('message');
          }
        ),
        { numRuns: 30, timeout: 10000 }
      );
    }, 15000);
  });

  describe('Property 14.3: Sensitive Information Protection', () => {
    /**
     * Property: Error messages should not leak sensitive information
     * such as passwords, tokens, or other secrets
     */
    it('should sanitize sensitive information from error messages', async () => {
      const sensitiveDataGenerator = fc.record({
        baseMessage: fc.string({ minLength: 10, maxLength: 50 }),
        sensitiveField: fc.constantFrom('password', 'token', 'secret', 'key', 'authorization'),
        sensitiveValue: fc.string({ minLength: 8, maxLength: 32 }),
        separator: fc.constantFrom(':', '=', ': ', ' = ', ' : '),
      });

      await fc.assert(
        fc.asyncProperty(
          sensitiveDataGenerator,
          async (testData) => {
            // Create error message with sensitive information
            const errorMessage = `${testData.baseMessage} ${testData.sensitiveField}${testData.separator}${testData.sensitiveValue}`;
            const error = new HttpException(errorMessage, HttpStatus.BAD_REQUEST);

            // Mock production environment to trigger sanitization
            (configService.get as jest.Mock).mockImplementation((key: string) => {
              if (key === 'NODE_ENV') return 'production';
              return undefined;
            });

            const filter = new AllExceptionsFilter(configService);
            filter.catch(error, mockHost);

            const jsonCall = mockResponse.json.mock.calls[0][0];

            // Verify sensitive value is not present in the response
            const responseString = JSON.stringify(jsonCall);
            expect(responseString).not.toContain(testData.sensitiveValue);

            // Verify the field name is still present but value is redacted
            if (jsonCall.message && typeof jsonCall.message === 'string') {
              expect(jsonCall.message).toContain(testData.sensitiveField);
              expect(jsonCall.message).toContain('[REDACTED]');
            }
          }
        ),
        { numRuns: 30, timeout: 10000 }
      );
    }, 15000);
  });

  describe('Property 14.4: Prisma Error Code Mapping Consistency', () => {
    /**
     * Property: Prisma error codes should be consistently mapped to
     * appropriate HTTP status codes and user-friendly messages
     */
    it('should consistently map Prisma error codes to HTTP status codes', async () => {
      const prismaErrorGenerator = fc.record({
        code: fc.constantFrom('P2000', 'P2001', 'P2002', 'P2003', 'P2004', 'P2005', 'P2006', 'P2007', 'P2025'),
        message: fc.string({ minLength: 10, maxLength: 100 }),
        meta: fc.record({
          target: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 20 })), { nil: undefined }),
        }),
      });

      await fc.assert(
        fc.asyncProperty(
          prismaErrorGenerator,
          async (errorData) => {
            const exception = new PrismaClientKnownRequestError(
              errorData.message,
              {
                code: errorData.code,
                clientVersion: '5.0.0',
                meta: errorData.meta,
              }
            );

            prismaExceptionFilter.catch(exception, mockHost);

            const statusCall = mockResponse.status.mock.calls[0][0];
            const jsonCall = mockResponse.json.mock.calls[0][0];

            // Verify consistent status code mapping
            const expectedStatusMap: Record<string, number> = {
              'P2000': HttpStatus.NOT_FOUND,
              'P2001': HttpStatus.NOT_FOUND,
              'P2002': HttpStatus.CONFLICT,
              'P2003': HttpStatus.BAD_REQUEST,
              'P2004': HttpStatus.BAD_REQUEST,
              'P2005': HttpStatus.BAD_REQUEST,
              'P2006': HttpStatus.BAD_REQUEST,
              'P2007': HttpStatus.BAD_REQUEST,
              'P2025': HttpStatus.NOT_FOUND,
            };

            expect(statusCall).toBe(expectedStatusMap[errorData.code]);

            // Verify user-friendly message is provided
            expect(jsonCall.message).toBeDefined();
            expect(jsonCall.message).not.toBe(errorData.message); // Should be transformed
            expect(typeof jsonCall.message).toBe('string');
            expect(jsonCall.message.length).toBeGreaterThan(0);

            // Verify error type is consistent
            expect(jsonCall.error).toBe('Database Error');

            // Verify response structure
            expect(jsonCall).toHaveProperty('statusCode', statusCall);
            expect(jsonCall).toHaveProperty('timestamp');
            expect(jsonCall).toHaveProperty('path');
            expect(jsonCall).toHaveProperty('method');
          }
        ),
        { numRuns: 40, timeout: 10000 }
      );
    }, 15000);
  });

  describe('Property 14.5: Error Response Immutability', () => {
    /**
     * Property: Error responses should be immutable and consistent
     * for the same error conditions across multiple invocations
     */
    it('should produce consistent error responses for identical error conditions', async () => {
      const consistencyTestGenerator = fc.record({
        errorType: fc.constantFrom('http', 'prisma_known', 'generic'),
        statusCode: fc.constantFrom(400, 404, 409, 500),
        message: fc.string({ minLength: 5, maxLength: 50 }),
        prismaCode: fc.constantFrom('P2001', 'P2002', 'P2025'),
      });

      await fc.assert(
        fc.asyncProperty(
          consistencyTestGenerator,
          async (testData) => {
            let exception: any;

            // Create exception based on type
            switch (testData.errorType) {
              case 'http':
                exception = new HttpException(testData.message, testData.statusCode);
                break;
              case 'prisma_known':
                exception = new PrismaClientKnownRequestError(
                  testData.message,
                  {
                    code: testData.prismaCode,
                    clientVersion: '5.0.0',
                    meta: {},
                  }
                );
                break;
              case 'generic':
                exception = new Error(testData.message);
                break;
            }

            // Process error multiple times
            const responses: any[] = [];
            for (let i = 0; i < 3; i++) {
              // Reset mocks
              mockResponse.status.mockClear();
              mockResponse.json.mockClear();

              // Process error
              if (testData.errorType === 'prisma_known') {
                prismaExceptionFilter.catch(exception, mockHost);
              } else {
                allExceptionsFilter.catch(exception, mockHost);
              }

              const statusCall = mockResponse.status.mock.calls[0][0];
              const jsonCall = mockResponse.json.mock.calls[0][0];

              responses.push({
                status: statusCall,
                body: { ...jsonCall, timestamp: 'NORMALIZED' }, // Normalize timestamp for comparison
              });
            }

            // Verify all responses are identical (except timestamp)
            const firstResponse = responses[0];
            for (let i = 1; i < responses.length; i++) {
              expect(responses[i].status).toBe(firstResponse.status);
              expect(responses[i].body.statusCode).toBe(firstResponse.body.statusCode);
              expect(responses[i].body.message).toBe(firstResponse.body.message);
              expect(responses[i].body.path).toBe(firstResponse.body.path);
              expect(responses[i].body.method).toBe(firstResponse.body.method);
              expect(responses[i].body.error).toBe(firstResponse.body.error);
            }
          }
        ),
        { numRuns: 20, timeout: 10000 }
      );
    }, 15000);
  });
});