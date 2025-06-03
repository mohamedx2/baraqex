import { Request, Response } from 'express';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

/**
 * Utility functions for server-side operations
 */

/**
 * Safely parse JSON with error handling
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch (error) {
    return fallback;
  }
}

/**
 * Generate a secure random token
 */
export function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Hash a string using SHA-256
 */
export function hashString(input: string, salt: string = ''): string {
  return crypto.createHash('sha256').update(input + salt).digest('hex');
}

/**
 * Get pagination parameters from request
 */
export function getPagination(req: Request): { page: number; limit: number; skip: number } {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const rawLimit = parseInt(req.query.limit as string);
  
  // If no limit is provided or limit is 0/invalid, use default of 20
  // If limit is provided and valid, enforce min of 1 and max of 100
  let limit: number;
  if (isNaN(rawLimit) || rawLimit <= 0) {
    limit = 20; // Default limit
  } else {
    limit = Math.max(1, Math.min(100, rawLimit));
  }
  
  const skip = (page - 1) * limit;
  
  return { page, limit, skip };
}

/**
 * Standard success response format
 */
export function sendSuccess<T>(res: Response, data: T, message: string = 'Success'): Response {
  return res.json({
    success: true,
    message,
    data
  });
}

/**
 * Standard error response format
 */
export function sendError(
  res: Response, 
  message: string = 'An error occurred', 
  statusCode: number = 400,
  errors?: any
): Response {
  return res.status(statusCode).json({
    success: false,
    message,
    errors: errors || undefined
  });
}

/**
 * Validate required fields in request body
 */
export function validateFields(
  req: Request, 
  requiredFields: string[]
): { valid: boolean; missing: string[] } {
  const missing = requiredFields.filter(field => {
    const value = req.body[field];
    return value === undefined || value === null || value === '';
  });
  
  return {
    valid: missing.length === 0,
    missing
  };
}

/**
 * Handle file upload validation
 */
export function validateFileUpload(
  file: any, // Using 'any' to avoid the Express.Multer dependency
  options: {
    maxSize?: number;
    allowedTypes?: string[];
  } = {}
): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }
  
  // Check file size
  if (options.maxSize && file.size > options.maxSize) {
    return { 
      valid: false, 
      error: `File too large. Maximum size allowed is ${options.maxSize / 1024 / 1024}MB` 
    };
  }
  
  // Check file type
  if (options.allowedTypes && options.allowedTypes.length > 0) {
    const fileType = file.mimetype;
    if (!options.allowedTypes.includes(fileType)) {
      return { 
        valid: false, 
        error: `Invalid file type. Allowed types: ${options.allowedTypes.join(', ')}` 
      };
    }
  }
  
  return { valid: true };
}

/**
 * Get server environment information
 */
export function getEnvironmentInfo(): Record<string, any> {
  return {
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    memory: process.memoryUsage(),
    uptime: process.uptime(),
    env: process.env.NODE_ENV || 'development'
  };
}

/**
 * Check if a directory is empty
 */
export async function isDirectoryEmpty(dirPath: string): Promise<boolean> {
  try {
    const files = await fs.readdir(dirPath);
    return files.length === 0;
  } catch (error) {
    // Directory doesn't exist or can't be read
    return true;
  }
}

/**
 * Create directory if it doesn't exist
 */
export async function ensureDirectory(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath);
  } catch (error) {
    // Directory doesn't exist, create it
    await fs.mkdir(dirPath, { recursive: true });
  }
}

/**
 * Write JSON to file
 */
export async function writeJsonFile(filePath: string, data: any): Promise<void> {
  await ensureDirectory(path.dirname(filePath));
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * Read JSON from file
 */
export async function readJsonFile<T>(filePath: string, defaultValue: T): Promise<T> {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return safeJsonParse<T>(data, defaultValue);
  } catch (error) {
    return defaultValue;
  }
}
