/**
 * Baraqex Error Classes
 * 
 * Custom error types for better debugging and error handling.
 * Each error type provides specific context and helpful messages.
 */

/**
 * Base error class for all Baraqex errors
 */
export class BaraqexError extends Error {
  public readonly code: string;
  public readonly hint?: string;
  public readonly docs?: string;
  public readonly originalCause?: Error;

  constructor(message: string, options: {
    code: string;
    hint?: string;
    docs?: string;
    cause?: Error;
  }) {
    super(message);
    this.name = 'BaraqexError';
    this.code = options.code;
    this.hint = options.hint;
    this.docs = options.docs;
    this.originalCause = options.cause;
    Error.captureStackTrace?.(this, this.constructor);
  }

  /**
   * Format error for console output with helpful hints
   */
  format(): string {
    let output = `\n❌ ${this.name}: ${this.message}\n`;
    output += `   Code: ${this.code}\n`;
    if (this.hint) {
      output += `   💡 Hint: ${this.hint}\n`;
    }
    if (this.docs) {
      output += `   📚 Docs: ${this.docs}\n`;
    }
    return output;
  }
}

/**
 * Configuration-related errors
 */
export class ConfigError extends BaraqexError {
  constructor(message: string, options?: { hint?: string; cause?: Error }) {
    super(message, {
      code: 'CONFIG_ERROR',
      hint: options?.hint || 'Check your baraqex.config.js or server configuration',
      docs: 'https://baraqex.tech/docs/configuration',
      cause: options?.cause
    });
    this.name = 'ConfigError';
  }
}

/**
 * Database connection and query errors
 */
export class DatabaseError extends BaraqexError {
  public readonly dbType?: string;
  
  constructor(message: string, options?: { 
    dbType?: string;
    hint?: string; 
    cause?: Error 
  }) {
    super(message, {
      code: 'DATABASE_ERROR',
      hint: options?.hint || 'Verify your database connection string and credentials',
      docs: 'https://baraqex.tech/docs/database',
      cause: options?.cause
    });
    this.name = 'DatabaseError';
    this.dbType = options?.dbType;
  }
}

/**
 * Authentication and authorization errors
 */
export class AuthError extends BaraqexError {
  constructor(message: string, options?: { hint?: string; cause?: Error }) {
    super(message, {
      code: 'AUTH_ERROR',
      hint: options?.hint || 'Check your JWT secret and token configuration',
      docs: 'https://baraqex.tech/docs/authentication',
      cause: options?.cause
    });
    this.name = 'AuthError';
  }
}

/**
 * WASM loading and execution errors
 */
export class WasmError extends BaraqexError {
  constructor(message: string, options?: { hint?: string; cause?: Error }) {
    super(message, {
      code: 'WASM_ERROR',
      hint: options?.hint || 'Ensure your .wasm file is accessible and properly compiled',
      docs: 'https://baraqex.tech/docs/webassembly',
      cause: options?.cause
    });
    this.name = 'WasmError';
  }
}

/**
 * Router and routing errors
 */
export class RouterError extends BaraqexError {
  constructor(message: string, options?: { hint?: string; cause?: Error }) {
    super(message, {
      code: 'ROUTER_ERROR',
      hint: options?.hint || 'Check your API route file structure and exports',
      docs: 'https://baraqex.tech/docs/routing',
      cause: options?.cause
    });
    this.name = 'RouterError';
  }
}

/**
 * Server lifecycle errors
 */
export class ServerError extends BaraqexError {
  constructor(message: string, options?: { hint?: string; cause?: Error }) {
    super(message, {
      code: 'SERVER_ERROR',
      hint: options?.hint || 'Check that the port is available and dependencies are installed',
      docs: 'https://baraqex.tech/docs/server',
      cause: options?.cause
    });
    this.name = 'ServerError';
  }
}

/**
 * Validation errors for user input
 */
export class ValidationError extends BaraqexError {
  public readonly field?: string;
  public readonly value?: unknown;

  constructor(message: string, options?: { 
    field?: string;
    value?: unknown;
    hint?: string; 
    cause?: Error 
  }) {
    super(message, {
      code: 'VALIDATION_ERROR',
      hint: options?.hint,
      cause: options?.cause
    });
    this.name = 'ValidationError';
    this.field = options?.field;
    this.value = options?.value;
  }
}

/**
 * HTTP-related errors with status codes
 */
export class HttpError extends BaraqexError {
  public readonly statusCode: number;

  constructor(statusCode: number, message: string, options?: { hint?: string }) {
    super(message, {
      code: `HTTP_${statusCode}`,
      hint: options?.hint
    });
    this.name = 'HttpError';
    this.statusCode = statusCode;
  }

  static badRequest(message = 'Bad Request', hint?: string) {
    return new HttpError(400, message, { hint });
  }

  static unauthorized(message = 'Unauthorized', hint?: string) {
    return new HttpError(401, message, { hint: hint || 'Include a valid Authorization header' });
  }

  static forbidden(message = 'Forbidden', hint?: string) {
    return new HttpError(403, message, { hint });
  }

  static notFound(message = 'Not Found', hint?: string) {
    return new HttpError(404, message, { hint });
  }

  static tooManyRequests(message = 'Too Many Requests', hint?: string) {
    return new HttpError(429, message, { hint: hint || 'Slow down your request rate' });
  }

  static internal(message = 'Internal Server Error', hint?: string) {
    return new HttpError(500, message, { hint });
  }
}

/**
 * Dependency missing errors
 */
export class DependencyError extends BaraqexError {
  public readonly packageName: string;

  constructor(packageName: string, feature: string) {
    super(`Missing dependency: ${packageName} is required for ${feature}`, {
      code: 'DEPENDENCY_ERROR',
      hint: `Install it with: npm install ${packageName}`,
      docs: 'https://baraqex.tech/docs/installation'
    });
    this.name = 'DependencyError';
    this.packageName = packageName;
  }
}

/**
 * Error handler for consistent error logging
 */
export function formatError(error: unknown): string {
  if (error instanceof BaraqexError) {
    return error.format();
  }
  
  if (error instanceof Error) {
    return `\n❌ Error: ${error.message}\n`;
  }
  
  return `\n❌ Unknown error: ${String(error)}\n`;
}

/**
 * Wrap async functions with error handling
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  errorHandler?: (error: Error) => void
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      if (errorHandler) {
        errorHandler(error as Error);
      } else {
        console.error(formatError(error));
      }
      throw error;
    }
  }) as T;
}
