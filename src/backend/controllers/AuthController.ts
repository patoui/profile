import { Request, Response } from 'express';
import * as bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma.js';

const ADMIN_EMAIL = process.env['ADMIN_EMAIL'] || 'patrique.ouimet@gmail.com';

export class AuthController {
  async showLoginForm(req: Request, res: Response): Promise<void> {
    res.render('auth/login', {
      title: 'Login',
      errors: {},
      old: {},
      currentPath: '',
    });
  }

  async login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;

    // Validate input
    const errors: Record<string, string> = {};
    if (!email) errors['email'] = 'Email is required';
    if (!password) errors['password'] = 'Password is required';

    if (Object.keys(errors).length > 0) {
      res.render('auth/login', {
        title: 'Login',
        errors,
        old: { email },
        currentPath: '',
      });
      return;
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      res.render('auth/login', {
        title: 'Login',
        errors: { email: 'Invalid credentials' },
        old: { email },
        currentPath: '',
      });
      return;
    }

    // Verify password
    // Convert PHP's $2y$ bcrypt prefix to Node.js compatible $2a$ prefix
    const compatibleHash = user.password.replace(/^\$2y\$/, '$2a$');
    const validPassword = await bcrypt.compare(password, compatibleHash);
    if (!validPassword) {
      res.render('auth/login', {
        title: 'Login',
        errors: { email: 'Invalid credentials' },
        old: { email },
        currentPath: '',
      });
      return;
    }

    // Create session
    req.session.userId = user.id;

    // Redirect based on role
    if (user.email === ADMIN_EMAIL) {
      res.redirect('/admin/dashboard');
    } else {
      res.redirect('/');
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err);
      }
      res.redirect('/');
    });
  }
}

export const authController = new AuthController();
