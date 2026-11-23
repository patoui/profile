import 'dotenv/config';
import { randomBytes } from 'node:crypto';
import express from 'express';
import session from 'express-session';
import { RedisStore } from 'connect-redis';
import { createClient } from 'redis';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { loadUser } from './middleware/auth.js';
import { flashMiddleware } from './middleware/flash.js';
import publicRoutes from './routes/public.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import { asset } from './utils/asset-helper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// In production, we run from dist/, so we need to go up 3 levels
// In development, we run from src/backend/, so we need to go up 2 levels
const isRunningFromDist = __dirname.includes('/dist');
const rootDir = isRunningFromDist
  ? path.join(__dirname, '../../..')
  : path.join(__dirname, '../..');

const app = express();

// Only the ingress subnet may supply forwarded client and TLS information.
if (process.env['TRUSTED_PROXY_CIDRS']) {
  app.set('trust proxy', process.env['TRUSTED_PROXY_CIDRS'].split(','));
}

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(rootDir, 'src/backend/views'));

app.locals['baseUrl'] = process.env['BASE_URL'] || 'http://localhost:3000';
app.locals['asset'] = asset;

// Observe the completed response, after express-session has decided whether to issue a cookie.
app.use((req, res, next) => {
  const login = req.method === 'POST' && req.path === '/login';
  const dashboard = req.method === 'GET' && req.path === '/admin/dashboard';
  if (login || dashboard) {
    res.once('finish', () => {
      if (dashboard && res.statusCode === 200) return;
      const cookies = res.getHeader('set-cookie') ?? [];
      console.info(JSON.stringify({
        event: login ? 'profile.login' : 'profile.dashboard',
        outcome: res.locals['authOutcome'] ?? 'request_completed',
        status: res.statusCode,
        secureRequest: req.secure,
        sessionCookieReceived: /(?:^|;\s*)connect\.sid=/.test(req.headers.cookie ?? ''),
        sessionCookieIssued: [cookies].flat().some(cookie => String(cookie).startsWith('connect.sid=')),
      }));
    });
  }
  next();
});

// Browser form mutations must originate from the configured public origin.
const publicOrigin = new URL(app.locals['baseUrl']).origin;
app.use((req, res, next) => {
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && req.get('origin') !== publicOrigin) {
    res.locals['authOutcome'] = 'origin_rejected';
    res.sendStatus(403);
    return;
  }
  next();
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static files
app.use(express.static(path.join(rootDir, 'public')));

const sessionSecret = process.env['SESSION_SECRET'];
if (process.env['NODE_ENV'] === 'production' && Buffer.byteLength(sessionSecret?.trim() ?? '') < 32) {
  throw new Error('SESSION_SECRET must contain at least 32 bytes in production');
}

// Local development can run without a Redis server.
const redisHost = process.env['REDIS_HOST'];
if (!redisHost && process.env['NODE_ENV'] === 'production') {
  throw new Error('REDIS_HOST is required for production sessions');
}
let sessionStore: RedisStore | undefined;
if (redisHost) {
  const username = process.env['REDIS_USERNAME'];
  const password = process.env['REDIS_PASSWORD'];
  if (!username || !password) throw new Error('Redis session credentials are required');
  const client = createClient({
    socket: { host: redisHost, port: Number(process.env['REDIS_PORT'] || 6379) },
    username, password,
  });
  client.on('error', (error: Error) => console.error('Session Redis error:', error.message));
  await client.connect();
  sessionStore = new RedisStore({ client, prefix: (process.env['REDIS_PREFIX'] || 'profile:') + 'session:' });
}

app.use(
  session({
    secret: sessionSecret || randomBytes(32).toString('hex'),
    ...(sessionStore && { store: sessionStore }),
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env['NODE_ENV'] === 'production',
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  })
);

// Flash messages middleware
app.use(flashMiddleware);

// Load user middleware
app.use(loadUser);

// Routes
app.use('/', publicRoutes);
app.use('/', authRoutes);
app.use('/admin', adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).render('errors/404', { message: 'Page not found' });
});

// Error handler
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    next: express.NextFunction
  ) => {
    console.error(err.stack);
    res.status(500).render('errors/500', { message: 'Something went wrong' });
  }
);

export default app;
