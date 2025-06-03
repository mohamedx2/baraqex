import {
  requestLogger,
  errorHandler,
  notFoundHandler,
  rateLimit
} from '../../src/server/middleware';
import { Request, Response, NextFunction } from 'express';

// Mock console.log and console.error
const originalLog = console.log;
const originalError = console.error;

beforeEach(() => {
  console.log = jest.fn();
  console.error = jest.fn();
});

afterEach(() => {
  console.log = originalLog;
  console.error = originalError;
});

// Mock Express objects
const mockRequest = (method = 'GET', url = '/', ip = '127.0.0.1') => ({
  method,
  url,
  ip
});

const mockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn();

describe('Server Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('requestLogger', () => {
    it('should log request method and URL', () => {
      const req = mockRequest('POST', '/api/test');
      const res = mockResponse();
      
      requestLogger(req as any, res, mockNext);
      
      expect(console.log).toHaveBeenCalled();
      const logCall = (console.log as jest.Mock).mock.calls[0][0];
      expect(logCall).toContain('POST /api/test');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should include timestamp in log', () => {
      const req = mockRequest();
      const res = mockResponse();
      
      requestLogger(req as any, res, mockNext);
      
      expect(console.log).toHaveBeenCalled();
      const logCall = (console.log as jest.Mock).mock.calls[0][0];
      expect(logCall).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/); // ISO timestamp format
    });
  });

  describe('errorHandler', () => {
    it('should handle errors in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at test';
      const req = mockRequest();
      const res = mockResponse();
      
      errorHandler(error, req as any, res, mockNext);
      
      expect(console.error).toHaveBeenCalledWith(error.stack);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          message: 'Internal Server Error',
          details: 'Test error',
          stack: error.stack
        }
      });
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should handle errors in production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const error = new Error('Test error');
      const req = mockRequest();
      const res = mockResponse();
      
      errorHandler(error, req as any, res, mockNext);
      
      expect(res.json).toHaveBeenCalledWith({
        error: {
          message: 'Internal Server Error'
        }
      });
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('notFoundHandler', () => {
    it('should return 404 for any request', () => {
      const req = mockRequest('GET', '/non-existent');
      const res = mockResponse();
      
      notFoundHandler(req as any, res);
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          message: 'Not Found - GET /non-existent'
        }
      });
    });
  });

  describe('rateLimit', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should allow requests under the limit', () => {
      const middleware = rateLimit({ windowMs: 60000, max: 5 });
      const req = mockRequest('GET', '/', '192.168.1.1');
      const res = mockResponse();
      
      // Make 3 requests (under limit of 5)
      for (let i = 0; i < 3; i++) {
        middleware(req as any, res, mockNext);
      }
      
      expect(mockNext).toHaveBeenCalledTimes(3);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should block requests over the limit', () => {
      const middleware = rateLimit({ windowMs: 60000, max: 2 });
      const req = mockRequest('GET', '/', '192.168.1.1');
      const res = mockResponse();
      
      // Make requests up to limit
      middleware(req as any, res, mockNext);
      middleware(req as any, res, mockNext);
      
      // This should be blocked
      middleware(req as any, res, mockNext);
      
      expect(mockNext).toHaveBeenCalledTimes(2);
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          message: 'Too Many Requests',
          retryAfter: 60
        }
      });
    });

    it('should reset limit after window expires', () => {
      const middleware = rateLimit({ windowMs: 1000, max: 1 });
      const req = mockRequest('GET', '/', '192.168.1.1');
      const res = mockResponse();
      
      // First request should pass
      middleware(req as any, res, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(1);
      
      // Second request should be blocked
      middleware(req as any, res, mockNext);
      expect(res.status).toHaveBeenCalledWith(429);
      
      // Advance time past window
      jest.advanceTimersByTime(1001);
      
      // Request should now pass again
      jest.clearAllMocks();
      middleware(req as any, res, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should track requests per IP separately', () => {
      const middleware = rateLimit({ windowMs: 60000, max: 1 });
      const req1 = mockRequest('GET', '/', '192.168.1.1');
      const req2 = mockRequest('GET', '/', '192.168.1.2');
      const res = mockResponse();
      
      // Both IPs should be allowed their first request
      middleware(req1 as any, res, mockNext);
      middleware(req2 as any, res, mockNext);
      
      expect(mockNext).toHaveBeenCalledTimes(2);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should handle unknown IP', () => {
      const middleware = rateLimit({ windowMs: 60000, max: 1 });
      const req = { method: 'GET', url: '/' }; // No IP
      const res = mockResponse();
      
      middleware(req as any, res, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
    });
  });
});
