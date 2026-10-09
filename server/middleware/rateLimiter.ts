import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

export function createRateLimiter(options: {
  windowMs: number;
  maxRequests: number;
  message?: string;
}) {
  const store = new Map<string, RateLimitRecord>();

  // Periodically cleanup expired entries to prevent memory growth
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      if (now > record.resetAt) {
        store.delete(key);
      }
    }
  }, options.windowMs);

  if (cleanupTimer.unref) {
    cleanupTimer.unref();
  }

  return (req: Request, res: Response, next: NextFunction) => {
    // Derive client identifier from IP
    const clientIp = (
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      'unknown-ip'
    );

    const now = Date.now();
    const record = store.get(clientIp);

    if (!record || now > record.resetAt) {
      store.set(clientIp, {
        count: 1,
        resetAt: now + options.windowMs
      });
      return next();
    }

    record.count += 1;

    if (record.count > options.maxRequests) {
      const waitSeconds = Math.ceil((record.resetAt - now) / 1000);
      return res.status(429).json({
        success: false,
        code: 'RATE_LIMIT_EXCEEDED',
        message: options.message || `MAOMBI MENGI MNO. Tafadhali subiri sekunde ${waitSeconds} kabla ya kujaribu tena.`
      });
    }

    next();
  };
}

// 1. Strict rate limiter for Authentication (login, registration, forgot password)
export const authRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 15,
  message: 'MAOMBI MENGI YA KUINGIA: Kwa usalama, tafadhali subiri dakika moja kabla ya kujaribu tena.'
});

// 2. Sensitive transaction rate limiter (NIDA request submission, Credit topup submission)
export const transactionRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 30,
  message: 'MAOMBI MENGI YA MIAMALA: Tafadhali subiri sekunde chache kabla ya kutuma ombi lingine.'
});
