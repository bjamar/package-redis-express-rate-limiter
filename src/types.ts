

export interface RateLimiterConfig {
    windowMs: number;
    limit: number;
    redisUrl: string;
    redisPassword: string;
  }