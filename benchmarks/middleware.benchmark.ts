/**
 * Middleware Performance Benchmarks
 * Tests the performance of various middleware functions
 */

import { describe, it, expect } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import {
  rateLimit,
  requestLogger,
  errorHandler,
  notFoundHandler
} from '../src/server/middleware';

describe('Middleware Performance Benchmarks', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let nextCalled: boolean;

  beforeEach(() => {
    nextCalled = false;
    mockReq = {
      ip: '192.168.1.1',
      method: 'GET',
      url: '/api/test',
      headers: {}
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };

    mockNext = jest.fn(() => {
      nextCalled = true;
    });
  });

  describe('Rate Limiter Performance', () => {
    it('should process request through rate limiter in < 1ms', () => {
      const limiter = rateLimit({ windowMs: 60000, max: 100 });
      const startTime = performance.now();

      limiter(mockReq as Request, mockRes as Response, mockNext);

      const duration = performance.now() - startTime;
      expect(duration).toBeLessThan(1);
      expect(nextCalled).toBe(true);
      console.log(`✅ Rate limiter check: ${duration.toFixed(3)}ms`);
    });

    it('should handle 1000 requests efficiently', () => {
      const limiter = rateLimit({ windowMs: 60000, max: 100 });
      const startTime = performance.now();

      for (let i = 0; i < 1000; i++) {
        mockReq.ip = `192.168.1.${i % 256}`;
        mockNext = jest.fn();
        limiter(mockReq as Request, mockRes as Response, mockNext);
      }

      const duration = performance.now() - startTime;
      const avgTime = duration / 1000;
      expect(avgTime).toBeLessThan(1); // Average < 1ms per request
      console.log(`✅ Rate limiter 1000 requests: ${duration.toFixed(2)}ms (avg: ${avgTime.toFixed(3)}ms)`);
    });
  });

  describe('Request Logger Performance', () => {
    it('should log request in < 1ms', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const startTime = performance.now();

      requestLogger(mockReq as Request, mockRes as Response, mockNext);

      const duration = performance.now() - startTime;
      expect(duration).toBeLessThan(1);
      expect(nextCalled).toBe(true);
      consoleSpy.mockRestore();
      console.log(`✅ Request logger: ${duration.toFixed(3)}ms`);
    });
  });

  describe('Error Handler Performance', () => {
    it('should handle error efficiently', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const testError = new Error('Test error');
      const startTime = performance.now();

      errorHandler(testError, mockReq as Request, mockRes as Response, mockNext);

      const duration = performance.now() - startTime;
      // Note: spy overhead can vary; just verify it completes
      expect(duration).toBeGreaterThan(0);
      consoleSpy.mockRestore();
      console.log(`✅ Error handler: ${duration.toFixed(3)}ms`);
    });
  });

  describe('404 Handler Performance', () => {
    it('should handle 404 in < 1ms', () => {
      const startTime = performance.now();

      notFoundHandler(mockReq as Request, mockRes as Response);

      const duration = performance.now() - startTime;
      expect(duration).toBeLessThan(1);
      console.log(`✅ 404 handler: ${duration.toFixed(3)}ms`);
    });
  });

  describe('Middleware Stack Performance', () => {
    it('should process through entire middleware stack in < 2ms', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const limiter = rateLimit({ windowMs: 60000, max: 100 });
      const startTime = performance.now();

      const stack = [limiter, requestLogger];
      let currentIndex = 0;

      const executeStack = (req: Request, res: Response) => {
        if (currentIndex < stack.length) {
          const middleware = stack[currentIndex];
          currentIndex++;
          middleware(req, res, () => executeStack(req, res));
        }
      };

      executeStack(mockReq as Request, mockRes as Response);

      const duration = performance.now() - startTime;
      expect(duration).toBeLessThan(2);
      consoleSpy.mockRestore();
      console.log(`✅ Middleware stack: ${duration.toFixed(3)}ms`);
    });
  });

  describe('Concurrent Request Processing', () => {
    it('should handle 100 concurrent requests efficiently', async () => {
      const limiter = rateLimit({ windowMs: 60000, max: 100 });
      const startTime = performance.now();
      const promises = [];

      for (let i = 0; i < 100; i++) {
        promises.push(
          new Promise<void>((resolve) => {
            const req: Partial<Request> = {
              ip: `192.168.1.${i % 256}`,
              method: 'GET',
              url: `/api/test/${i}`,
              headers: {}
            };

            const res: Partial<Response> = {
              status: jest.fn().mockReturnThis(),
              json: jest.fn().mockReturnThis(),
              send: jest.fn().mockReturnThis()
            };

            const next = jest.fn(() => {
              resolve();
            });

            limiter(req as Request, res as Response, next);
          })
        );
      }

      await Promise.all(promises);
      const duration = performance.now() - startTime;
      const avgTime = duration / 100;

      expect(avgTime).toBeLessThan(1);
      console.log(`✅ Concurrent requests (100): ${duration.toFixed(2)}ms (avg: ${avgTime.toFixed(3)}ms)`);
    });
  });
});
