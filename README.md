# Redis Express Rate Limiter for Node.js

This is a simple rate limiter middleware for express that incorperates the express-rate-limit library and the rate-limit-redis library as well as the redis library.The middleware is currently limited to rate limiting for /:endpointId.
This is useful for rate limiting api endpoints given to users for webhook integration with external services. Other usecase will be available soon. 

## Features

- Uses redis to store the rate limit data
- Uses the express-rate-limit library to handle the rate limiting
- Uses the rate-limit-redis library to handle the rate limiting
- Uses the redis library to connect to the redis server

## Installation

```bash
npm install redis-express-rate-limiter
```

## Usage

```typescript
//typescript
import type { Request, Response, NextFunction } from "express";
import { createRateLimiter } from "redis-express-rate-limiter";

const rateLimiter = createRateLimiter({
    redisUrl: "redis://localhost:6379",
    redisPassword: "your-redis-password",
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // limit each /:endpointId to 100 requests per windowMs
});


// Export the middleware function directly
export default (req: Request, res: Response, next: NextFunction) => rateLimiterMiddleware.endpointId(req, res, next);

```

```typescript
//Using the rate limiter middleware

import express from "express";
const app = express();
import endpointRateLimiter from "./path/to/rateLimiterMiddleware";

app.post("/:endpointId", endpointRateLimiter, (req, res) => {
    res.send("Hello World");
});

```



