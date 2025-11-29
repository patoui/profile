import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';

const ADMIN_EMAIL = process.env['ADMIN_EMAIL'] || 'patrique.ouimet@gmail.com';

export async function loadUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  res.locals.user = null;
  res.locals.isAdmin = false;
  res.locals.appName = process.env['APP_NAME'] || 'Profile';

  if (req.session.userId) {
    const user = await prisma.user.findUnique({
      where: { id: req.session.userId },
    });

    if (user) {
      req.user = user;
      res.locals.user = user;
      res.locals.isAdmin = user.email === ADMIN_EMAIL;
    }
  }

  next();
}

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    req.session.flash = {
      ...req.session.flash,
      error: ['Please login to continue.'],
    };
    res.redirect('/login');
    return;
  }
  next();
}

export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    req.session.flash = {
      ...req.session.flash,
      error: ['Please login to continue.'],
    };
    res.redirect('/login');
    return;
  }

  if (req.user.email !== ADMIN_EMAIL) {
    res.status(403).render('errors/403', { message: 'Access denied' });
    return;
  }

  next();
}

export function guest(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (req.user) {
    res.redirect('/');
    return;
  }
  next();
}
