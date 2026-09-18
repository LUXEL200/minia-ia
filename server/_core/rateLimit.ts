import type { NextFunction, Request, Response } from "express";

type Bucket = { count: number; resetAt: number };

export function rateLimit(options: { windowMs: number; max: number; name: string }) {
  const buckets = new Map<string, Bucket>();
  return (req: Request, res: Response, next: NextFunction) => {
    // Do not trust a client-supplied X-Forwarded-For header. If the deployment
    // is behind a trusted proxy, configure Express `trust proxy` and use req.ip.
    const key = `${options.name}:${req.ip || req.socket.remoteAddress || "unknown"}`;
    const now = Date.now();
    const current = buckets.get(key);
    const bucket = !current || current.resetAt <= now
      ? { count: 0, resetAt: now + options.windowMs }
      : current;
    bucket.count += 1;
    buckets.set(key, bucket);

    if (bucket.count > options.max) {
      const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
      res.setHeader("Retry-After", String(retryAfter));
      res.status(429).json({ error: "Too many requests" });
      return;
    }
    next();
  };
}
