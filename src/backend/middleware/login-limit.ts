import { createHash } from 'node:crypto';
import type { RequestHandler } from 'express';
import { Pool } from 'pg';
import { RateLimiterPostgres, RateLimiterRes } from 'rate-limiter-flexible';

const pool = new Pool({
  connectionString: process.env['TEST_DATABASE_URL'] || process.env['DATABASE_URL'],
  max: 2,
});

pool.on('error', (error: Error) => console.error('Login limiter database connection failed', error.message));

function createLimiter(): Promise<RateLimiterPostgres> {
  return new Promise((resolve, reject) => {
    const limiter = new RateLimiterPostgres({
      storeClient: pool,
      tableName: 'login_attempts',
      points: 30,
      duration: 60,
    }, error => error ? reject(error) : resolve(limiter));
  });
}

let ready: Promise<RateLimiterPostgres> | undefined;
export const limitLogin: RequestHandler = async (req, res, next) => {
  try {
    ready ??= createLimiter().catch((error: unknown) => {
      ready = undefined;
      throw error;
    });
    const limiter = await ready;
    await limiter.consume('ip:' + req.ip);
    const email: unknown = req.body?.email;
    if (typeof email !== 'string' || typeof req.body?.password !== 'string') {
      res.locals['authOutcome'] = 'malformed_credentials';
      res.sendStatus(400);
      return;
    }
    const account = createHash('sha256').update(email.trim().toLowerCase()).digest('hex');
    // Each account gets six attempts within the same 30-point window.
    await limiter.consume('account:' + account, 5);
    next();
  } catch (error) {
    if (error instanceof RateLimiterRes) {
      res.locals['authOutcome'] = 'rate_limited';
      res.set('Retry-After', String(Math.ceil(error.msBeforeNext / 1000))).sendStatus(429);
      return;
    }
    next(error);
  }
};
