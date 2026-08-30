/**
 * Express middleware utilities
 */

export interface MiddlewareFunction {
  (req: any, res: any, next: any): void | Promise<void>;
}

export const requestLogger: MiddlewareFunction = (req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
};

export const errorHandler = (
  err: Error,
  req: any,
  res: any,
  _next: any
) => {
  console.error(err.stack);
  res.status(500).json({
    error: {
      message: 'Internal Server Error',
      ...(process.env.NODE_ENV !== 'production'
        ? { details: err.message, stack: err.stack }
        : {})
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

/**
 * Rate limiting middleware with automatic cleanup.
 *
 * Uses a sliding-window counter per IP. Old entries are pruned on every
 * request and a periodic interval cleans up idle IPs.
 */
export function rateLimit(options: { windowMs: number; max: number }) {
  const requests = new Map<string, number[]>();

  // Periodic cleanup to prevent memory leak from abandoned IPs
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [ip, times] of requests) {
      const valid = times.filter(t => now - t < options.windowMs);
      if (valid.length === 0) {
        requests.delete(ip);
      } else {
        requests.set(ip, valid);
      }
    }
  }, options.windowMs);

  // Allow the timer to not keep the process alive
  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }

  return (req: any, res: any, next: any) => {
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    const now = Date.now();

    const reqTimes = (requests.get(ip) || [])
      .filter(time => now - time < options.windowMs);

    reqTimes.push(now);
    requests.set(ip, reqTimes);

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
