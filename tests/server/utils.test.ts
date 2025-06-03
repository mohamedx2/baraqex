import {
  safeJsonParse,
  generateToken,
  hashString,
  getPagination,
  sendSuccess,
  sendError,
  validateFields,
  validateFileUpload,
  getEnvironmentInfo,
  isDirectoryEmpty,
  ensureDirectory,
  writeJsonFile,
  readJsonFile
} from '../../src/server/utils';
import fs from 'fs/promises';
import path from 'path';

// Mock Express Response for testing
const mockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// Mock Express Request for testing
const mockRequest = (body: any = {}, query: any = {}) => ({
  body,
  query
});

describe('Server Utils', () => {
  describe('safeJsonParse', () => {
    it('should parse valid JSON', () => {
      const result = safeJsonParse('{"test": "value"}', {});
      expect(result).toEqual({ test: 'value' });
    });

    it('should return fallback for invalid JSON', () => {
      const fallback = { default: true };
      const result = safeJsonParse('invalid json', fallback);
      expect(result).toBe(fallback);
    });
  });

  describe('generateToken', () => {
    it('should generate a token of default length', () => {
      const token = generateToken();
      expect(token).toHaveLength(64); // 32 bytes = 64 hex characters
    });

    it('should generate a token of specified length', () => {
      const token = generateToken(16);
      expect(token).toHaveLength(32); // 16 bytes = 32 hex characters
    });

    it('should generate different tokens each time', () => {
      const token1 = generateToken();
      const token2 = generateToken();
      expect(token1).not.toBe(token2);
    });
  });

  describe('hashString', () => {
    it('should hash a string consistently', () => {
      const hash1 = hashString('test');
      const hash2 = hashString('test');
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 produces 64 hex characters
    });

    it('should produce different hashes for different inputs', () => {
      const hash1 = hashString('test1');
      const hash2 = hashString('test2');
      expect(hash1).not.toBe(hash2);
    });

    it('should use salt when provided', () => {
      const hash1 = hashString('test', 'salt1');
      const hash2 = hashString('test', 'salt2');
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('getPagination', () => {
    it('should return default pagination', () => {
      const req = mockRequest();
      const result = getPagination(req);
      expect(result).toEqual({ page: 1, limit: 20, skip: 0 });
    });

    it('should parse query parameters', () => {
      const req = mockRequest({}, { page: '2', limit: '10' });
      const result = getPagination(req);
      expect(result).toEqual({ page: 2, limit: 10, skip: 10 });
    });

    it('should enforce minimum values', () => {
      const req = mockRequest({}, { page: '0', limit: '0' });
      const result = getPagination(req);
      expect(result).toEqual({ page: 1, limit: 1, skip: 0 });
    });

    it('should enforce maximum limit', () => {
      const req = mockRequest({}, { limit: '200' });
      const result = getPagination(req);
      expect(result.limit).toBe(100);
    });
  });

  describe('sendSuccess', () => {
    it('should send success response with default message', () => {
      const res = mockResponse();
      const data = { test: 'data' };
      
      sendSuccess(res, data);
      
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Success',
        data
      });
    });

    it('should send success response with custom message', () => {
      const res = mockResponse();
      const data = { test: 'data' };
      
      sendSuccess(res, data, 'Custom message');
      
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Custom message',
        data
      });
    });
  });

  describe('sendError', () => {
    it('should send error response with defaults', () => {
      const res = mockResponse();
      
      sendError(res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'An error occurred',
        errors: undefined
      });
    });

    it('should send error response with custom values', () => {
      const res = mockResponse();
      const errors = { field: 'error' };
      
      sendError(res, 'Custom error', 500, errors);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Custom error',
        errors
      });
    });
  });

  describe('validateFields', () => {
    it('should validate required fields successfully', () => {
      const req = mockRequest({ name: 'test', email: 'test@example.com' });
      const result = validateFields(req, ['name', 'email']);
      
      expect(result).toEqual({ valid: true, missing: [] });
    });

    it('should identify missing fields', () => {
      const req = mockRequest({ name: 'test' });
      const result = validateFields(req, ['name', 'email', 'password']);
      
      expect(result).toEqual({ 
        valid: false, 
        missing: ['email', 'password'] 
      });
    });

    it('should treat empty strings as missing', () => {
      const req = mockRequest({ name: '', email: null });
      const result = validateFields(req, ['name', 'email']);
      
      expect(result).toEqual({ 
        valid: false, 
        missing: ['name', 'email'] 
      });
    });
  });

  describe('validateFileUpload', () => {
    it('should validate missing file', () => {
      const result = validateFileUpload(null);
      expect(result).toEqual({ 
        valid: false, 
        error: 'No file provided' 
      });
    });

    it('should validate file size', () => {
      const file = { size: 2000000, mimetype: 'image/jpeg' };
      const options = { maxSize: 1000000 };
      
      const result = validateFileUpload(file, options);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('File too large');
    });

    it('should validate file type', () => {
      const file = { size: 1000, mimetype: 'text/plain' };
      const options = { allowedTypes: ['image/jpeg', 'image/png'] };
      
      const result = validateFileUpload(file, options);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid file type');
    });

    it('should pass validation for valid file', () => {
      const file = { size: 1000, mimetype: 'image/jpeg' };
      const options = { maxSize: 2000, allowedTypes: ['image/jpeg'] };
      
      const result = validateFileUpload(file, options);
      expect(result).toEqual({ valid: true });
    });
  });

  describe('getEnvironmentInfo', () => {
    it('should return environment information', () => {
      const info = getEnvironmentInfo();
      
      expect(info).toHaveProperty('nodeVersion');
      expect(info).toHaveProperty('platform');
      expect(info).toHaveProperty('arch');
      expect(info).toHaveProperty('memory');
      expect(info).toHaveProperty('uptime');
      expect(info).toHaveProperty('env');
    });
  });

  describe('File system utilities', () => {
    const testDir = path.join(process.cwd(), 'test-temp');
    const testFile = path.join(testDir, 'test.json');

    afterEach(async () => {
      try {
        await fs.rm(testDir, { recursive: true, force: true });
      } catch (error) {
        // Ignore cleanup errors
      }
    });

    describe('ensureDirectory', () => {
      it('should create directory if it does not exist', async () => {
        await ensureDirectory(testDir);
        
        const stats = await fs.stat(testDir);
        expect(stats.isDirectory()).toBe(true);
      });
    });

    describe('isDirectoryEmpty', () => {
      it('should return true for non-existent directory', async () => {
        const result = await isDirectoryEmpty('/non/existent/path');
        expect(result).toBe(true);
      });

      it('should return true for empty directory', async () => {
        await ensureDirectory(testDir);
        const result = await isDirectoryEmpty(testDir);
        expect(result).toBe(true);
      });

      it('should return false for non-empty directory', async () => {
        await ensureDirectory(testDir);
        await fs.writeFile(path.join(testDir, 'file.txt'), 'content');
        
        const result = await isDirectoryEmpty(testDir);
        expect(result).toBe(false);
      });
    });

    describe('writeJsonFile and readJsonFile', () => {
      it('should write and read JSON file', async () => {
        const data = { test: 'value', number: 42 };
        
        await writeJsonFile(testFile, data);
        const result = await readJsonFile(testFile, {});
        
        expect(result).toEqual(data);
      });

      it('should return default value for non-existent file', async () => {
        const defaultValue = { default: true };
        const result = await readJsonFile('/non/existent/file.json', defaultValue);
        
        expect(result).toBe(defaultValue);
      });
    });
  });
});
