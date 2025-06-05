import { Request, Response, NextFunction } from 'express';

export interface MiddlewareFunction {
  (req: any, res: any, next: any): void | Promise<void>;
}

// Common middleware functions
export const requestLogger: MiddlewareFunction = (req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
};

export const errorHandler = (
  err: Error, 
  req: any, 
  res: any, 
  next: any
) => {
  console.error(err.stack);
  res.status(500).json({
    error: {
      message: 'Internal Server Error',
      ...(process.env.NODE_ENV !== 'production' ? { details: err.message, stack: err.stack } : {})
    }
  });
};

export const notFoundHandler = (req: any, res: any) => {
  res.status(404).json({
    error: {
      message: `Not Found - ${req.method} ${req.url}`
    }
  });
};

// Middleware for rate limiting
export function rateLimit(options: { windowMs: number; max: number }) {
  const requests = new Map<string, number[]>();
  
  return (req: any, res: any, next: any) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    
    // Get existing requests and filter out old ones
    const reqTimes = (requests.get(ip) || [])
      .filter(time => now - time < options.windowMs);
    
    // Add current request
    reqTimes.push(now);
    requests.set(ip, reqTimes);
    
    // Check if too many requests
    if (reqTimes.length > options.max) {
      return res.status(429).json({
        error: {
          message: 'Too Many Requests',
          retryAfter: Math.ceil(options.windowMs / 1000)
        }
      });
    }
    
    return next();
  };
}
