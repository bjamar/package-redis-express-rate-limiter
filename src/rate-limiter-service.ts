import { type RedisClientType, createClient } from "redis";
import type { Request, Response, NextFunction } from "express";
import rateLimit, { RateLimitRequestHandler } from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import type { RateLimiterConfig } from "./types";

export class RateLimiterService {
  private redisClient!: RedisClientType;
  private rateLimitEndpointId!: RateLimitRequestHandler;
  private initialized: Promise<void>;

  constructor(private config: RateLimiterConfig) {
    this.validateConfig(config);
    this.initialized = this.initialize();
  }

  private validateConfig(config: RateLimiterConfig) {
    const { windowMs, limit, redisUrl, redisPassword } = config;
    if (!windowMs || windowMs <= 0) {
      throw new Error('windowMs must be a positive number');
    }
    if (!limit || limit <= 0) {
      throw new Error('limit must be a positive number');
    }
    if (!redisUrl) {
      throw new Error('redisUrl is required');
    }
    if (!redisPassword) {
      throw new Error('redisPassword is required');
    }
  }

  private async initialize(): Promise<void> {
    try {
      // Initialize Redis client
      this.redisClient = createClient({
        url: this.config.redisUrl,
        password: this.config.redisPassword,
      });

      this.redisClient.on("error", (err) => {
        console.error("Redis error:", err);
      });

      await this.redisClient.connect();

      // Initialize Redis store
      const redisStore = new RedisStore({
        sendCommand: (...args: string[]) => this.redisClient.sendCommand(args),
        prefix: "rate_limit:",
      });

      // Initialize rate limiter
      this.rateLimitEndpointId = rateLimit({
        store: redisStore,
        windowMs: this.config.windowMs,
        limit: this.config.limit,
        legacyHeaders: true,
        standardHeaders: true,
        message: "Too many requests, please try again later.",
        keyGenerator: this.extractEndpointId,
      });
    } catch (error) {
      throw new Error(`Failed to initialize rate limiter: ${error}`);
    }
  }

  private extractEndpointId(req: Request): string {
    // Extract webhookId from URL parameters
    const endpointId = req.params.endpointId || req.path.split('/').pop();
    
    if (!endpointId) {
      throw new Error("Missing endpointId parameter for rate limiting");
    }

    return `endpoint:${endpointId}`;
  }

  public async endpointId(req: Request, res: Response, next: NextFunction) {
    await this.initialized;
    return this.rateLimitEndpointId(req, res, next);
  }

  public async cleanup(): Promise<void> {
    await this.redisClient.quit();
  }
}