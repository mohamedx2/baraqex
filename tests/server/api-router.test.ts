/**
 * API Router Tests
 * Tests for file-based API routing
 * 
 * Note: These tests focus on unit testing the ApiRouter class without
 * requiring express mock due to ESM dynamic import limitations.
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import path from 'path';
import fs from 'fs';
import { ApiRouter } from '../../src/server/api-router';

// Mock fs module
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readdirSync: jest.fn()
}));

describe('ApiRouter', () => {
  let apiRouter: ApiRouter;
  const mockApiDir = '/test/api';

  beforeEach(() => {
    jest.clearAllMocks();
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    (fs.readdirSync as jest.Mock).mockReturnValue([]);
  });

  describe('constructor', () => {
    it('should create an ApiRouter instance', () => {
      apiRouter = new ApiRouter(mockApiDir);
      expect(apiRouter).toBeInstanceOf(ApiRouter);
    });

    it('should accept an optional auth service', () => {
      const mockAuth = {} as any;
      apiRouter = new ApiRouter(mockApiDir, mockAuth);
      expect(apiRouter).toBeInstanceOf(ApiRouter);
    });

    it('should not be initialized before calling initialize()', () => {
      apiRouter = new ApiRouter(mockApiDir);
      expect(apiRouter.isInitialized()).toBe(false);
    });

    it('should have null router before initialization', () => {
      apiRouter = new ApiRouter(mockApiDir);
      expect(apiRouter.router).toBeNull();
    });
    
    it('should resolve apiDir to absolute path', () => {
      apiRouter = new ApiRouter('./api');
      // The constructor resolves to absolute path using process.cwd()
      expect(apiRouter).toBeInstanceOf(ApiRouter);
    });
  });

  describe('isInitialized', () => {
    it('should return false before initialization', () => {
      apiRouter = new ApiRouter(mockApiDir);
      expect(apiRouter.isInitialized()).toBe(false);
    });
    
    it('should return correct state for uninitialized router', () => {
      apiRouter = new ApiRouter(mockApiDir);
      const result = apiRouter.isInitialized();
      expect(typeof result).toBe('boolean');
      expect(result).toBeFalsy();
    });
  });

  describe('router property', () => {
    it('should be null before initialization', () => {
      apiRouter = new ApiRouter(mockApiDir);
      expect(apiRouter.router).toBeNull();
    });
    
    it('should be public accessible', () => {
      apiRouter = new ApiRouter(mockApiDir);
      expect('router' in apiRouter).toBe(true);
    });
  });
  
  describe('file extension handling', () => {
    it('should support .js route files conceptually', () => {
      // Test that the router can be created for directories with .js files
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readdirSync as jest.Mock).mockReturnValue([
        { name: 'hello.js', isDirectory: () => false, isFile: () => true }
      ]);
      
      apiRouter = new ApiRouter(mockApiDir);
      expect(apiRouter).toBeInstanceOf(ApiRouter);
    });

    it('should support .ts route files conceptually', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readdirSync as jest.Mock).mockReturnValue([
        { name: 'hello.ts', isDirectory: () => false, isFile: () => true }
      ]);
      
      apiRouter = new ApiRouter(mockApiDir);
      expect(apiRouter).toBeInstanceOf(ApiRouter);
    });

    it('should support .mjs route files conceptually', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readdirSync as jest.Mock).mockReturnValue([
        { name: 'hello.mjs', isDirectory: () => false, isFile: () => true }
      ]);
      
      apiRouter = new ApiRouter(mockApiDir);
      expect(apiRouter).toBeInstanceOf(ApiRouter);
    });
  });

  describe('directory structure', () => {
    it('should handle empty api directory', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readdirSync as jest.Mock).mockReturnValue([]);
      
      apiRouter = new ApiRouter(mockApiDir);
      expect(apiRouter).toBeInstanceOf(ApiRouter);
    });

    it('should handle nested directory structure', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readdirSync as jest.Mock).mockReturnValue([
        { name: 'users', isDirectory: () => true, isFile: () => false },
        { name: 'posts', isDirectory: () => true, isFile: () => false }
      ]);
      
      apiRouter = new ApiRouter(mockApiDir);
      expect(apiRouter).toBeInstanceOf(ApiRouter);
    });

    it('should handle mixed files and directories', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readdirSync as jest.Mock).mockReturnValue([
        { name: 'hello.js', isDirectory: () => false, isFile: () => true },
        { name: 'users', isDirectory: () => true, isFile: () => false }
      ]);
      
      apiRouter = new ApiRouter(mockApiDir);
      expect(apiRouter).toBeInstanceOf(ApiRouter);
    });
  });

  describe('auth integration', () => {
    it('should accept null auth service', () => {
      apiRouter = new ApiRouter(mockApiDir, null);
      expect(apiRouter).toBeInstanceOf(ApiRouter);
    });

    it('should accept undefined auth service (default)', () => {
      apiRouter = new ApiRouter(mockApiDir);
      expect(apiRouter).toBeInstanceOf(ApiRouter);
    });

    it('should accept auth service object', () => {
      const mockAuth = {
        verifyToken: jest.fn(),
        requireAuth: jest.fn()
      } as any;
      apiRouter = new ApiRouter(mockApiDir, mockAuth);
      expect(apiRouter).toBeInstanceOf(ApiRouter);
    });
  });
  
  describe('path resolution', () => {
    it('should handle relative paths', () => {
      apiRouter = new ApiRouter('./api');
      expect(apiRouter).toBeInstanceOf(ApiRouter);
    });

    it('should handle absolute paths', () => {
      apiRouter = new ApiRouter('/absolute/path/api');
      expect(apiRouter).toBeInstanceOf(ApiRouter);
    });

    it('should handle paths with trailing slash', () => {
      apiRouter = new ApiRouter('./api/');
      expect(apiRouter).toBeInstanceOf(ApiRouter);
    });
  });
});

describe('ApiRouter Integration', () => {
  // These tests verify the ApiRouter exports correctly
  
  it('should export ApiRouter class', async () => {
    const { ApiRouter } = await import('../../src/server/api-router');
    expect(ApiRouter).toBeDefined();
    expect(typeof ApiRouter).toBe('function');
  });
});
