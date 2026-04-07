// In-Memory Rate Limiter for standard API routes (Alternative to Redis for low-cost setups)

interface RateLimitTracker {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitTracker>();

export function getRateLimit(identifier: string, limit: number, windowMs: number): { success: boolean; limit: number; remaining: number } {
  const now = Date.now();
  const tracker = rateLimitMap.get(identifier);

  // If new or expired
  if (!tracker || tracker.resetTime < now) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return { success: true, limit, remaining: limit - 1 };
  }

  // If hit limit
  if (tracker.count >= limit) {
    return { success: false, limit, remaining: 0 };
  }

  // Track hit
  tracker.count += 1;
  return { success: true, limit, remaining: limit - tracker.count };
}
