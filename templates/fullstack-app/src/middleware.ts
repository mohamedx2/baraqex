// Next.js-like global middleware
import { Request, Response, NextFunction } from 'express';

// Extend the Express Request interface
declare global {
  namespace Express {
    interface Request {
      timestamp: string;
    }
  }
}

// This middleware will be applied to all routes (API and pages)
export default async function middleware(req: Request, res: Response, next?: NextFunction) {
  // Add request timestamp
  req.timestamp = await new Date().toISOString();
  
  // Log all requests in development mode
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[${req.timestamp}] ${req.method} ${req.url}`);
  }
  
  // Example of response header modification
  res.setHeader('X-Powered-By', 'Frontend Hamroun');
  
  // Continue to next middleware
  if (next) next();
}
