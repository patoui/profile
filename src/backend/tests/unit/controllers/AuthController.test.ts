import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockRequest, createMockResponse } from '../../setup.js';

vi.mock('../../../lib/prisma.js', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('bcrypt', () => ({
  compare: vi.fn(),
}));

import { AuthController } from '../../../controllers/AuthController.js';
import { prisma } from '../../../lib/prisma.js';
import * as bcrypt from 'bcrypt';

describe('AuthController', () => {
  let controller: AuthController;
  let req: ReturnType<typeof createMockRequest>;
  let res: ReturnType<typeof createMockResponse>;

  beforeEach(() => {
    vi.clearAllMocks();
    controller = new AuthController();
    req = createMockRequest();
    res = createMockResponse();
  });

  describe('showLoginForm', () => {
    it('renders login form', async () => {
      await controller.showLoginForm(req as any, res as any);

      expect(res.render).toHaveBeenCalledWith('auth/login', {
        title: 'Login',
        errors: {},
        old: {},
        currentPath: '',
      });
    });
  });

  describe('login', () => {
    it('renders errors when email is missing', async () => {
      req.body = { password: 'password' };

      await controller.login(req as any, res as any);

      expect(res.render).toHaveBeenCalledWith('auth/login', expect.objectContaining({
        errors: expect.objectContaining({ email: 'Email is required' }),
      }));
    });

    it('renders errors when password is missing', async () => {
      req.body = { email: 'test@test.com' };

      await controller.login(req as any, res as any);

      expect(res.render).toHaveBeenCalledWith('auth/login', expect.objectContaining({
        errors: expect.objectContaining({ password: 'Password is required' }),
      }));
    });

    it('renders error when user not found', async () => {
      req.body = { email: 'notfound@test.com', password: 'password' };
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await controller.login(req as any, res as any);

      expect(res.render).toHaveBeenCalledWith('auth/login', expect.objectContaining({
        errors: { email: 'Invalid credentials' },
        old: { email: 'notfound@test.com' },
      }));
    });

    it('renders error when password is invalid', async () => {
      const mockUser = { id: 1, email: 'test@test.com', password: '$2a$10$hash' };
      req.body = { email: 'test@test.com', password: 'wrongpassword' };
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      await controller.login(req as any, res as any);

      expect(res.render).toHaveBeenCalledWith('auth/login', expect.objectContaining({
        errors: { email: 'Invalid credentials' },
      }));
    });

    it('creates session and redirects to home for regular user', async () => {
      const mockUser = { id: 1, email: 'user@test.com', password: '$2a$10$hash' };
      req.body = { email: 'user@test.com', password: 'password' };
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      await controller.login(req as any, res as any);

      expect(req.session.userId).toBe(1);
      expect(res.redirect).toHaveBeenCalledWith('/');
    });

    it('redirects to admin dashboard for admin user', async () => {
      const mockUser = { id: 1, email: 'admin@test.com', password: '$2a$10$hash' };
      req.body = { email: 'admin@test.com', password: 'password' };
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      await controller.login(req as any, res as any);

      expect(res.redirect).toHaveBeenCalledWith('/admin/dashboard');
    });

    it('handles PHP bcrypt prefix conversion', async () => {
      const mockUser = { id: 1, email: 'test@test.com', password: '$2y$10$hash' };
      req.body = { email: 'test@test.com', password: 'password' };
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      await controller.login(req as any, res as any);

      expect(bcrypt.compare).toHaveBeenCalledWith('password', '$2a$10$hash');
    });
  });

  describe('logout', () => {
    it('destroys session and redirects to home', async () => {
      await controller.logout(req as any, res as any);

      expect(req.session.destroy).toHaveBeenCalled();
      expect(res.redirect).toHaveBeenCalledWith('/');
    });
  });
});
