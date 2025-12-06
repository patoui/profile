import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { loadUser } from './middleware/auth.js';
import { flashMiddleware } from './middleware/flash.js';
import publicRoutes from './routes/public.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// In production, we run from dist/, so we need to go up 3 levels
// In development, we run from src/backend/, so we need to go up 2 levels
const isRunningFromDist = __dirname.includes('/dist');
const rootDir = isRunningFromDist
  ? path.join(__dirname, '../../..')
  : path.join(__dirname, '../..');

const app = express();

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(rootDir, 'src/backend/views'));

// Make baseUrl available to all views
app.locals['baseUrl'] = process.env['BASE_URL'] || 'http://localhost:3000';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static files
app.use(express.static(path.join(rootDir, 'public')));

// Session configuration
app.use(
  session({
    secret: process.env['SESSION_SECRET'] || 'default-secret-change-me',
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
