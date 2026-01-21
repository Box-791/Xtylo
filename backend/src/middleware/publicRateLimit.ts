import { Request, Response, NextFunction } from "express";

/**
 * Very simple in-memory rate limiter for the public intake endpoint.
 * Good enough for a single-instance server.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function publicRateLimit(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const now = Date.now();

  const windowMs = 60_000; // 1 minute
  const max = 30;          // 30 submits per minute per IP

  const b = buckets.get(ip);
  if (!b || now > b.resetAt) {
    buckets.set(ip, { count: 1, resetAt: now + windowMs });
    return next();
  }

  b.count += 1;
  if (b.count > max) {
    return res.status(429).json({ error: "Too many requests. Please wait a moment." });
  }

  next();
}
