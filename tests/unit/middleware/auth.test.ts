import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockRequest, createMockResponse, createMockNext } from '../../setup.js';

vi.mock('../../../lib/prisma.js', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

import { loadUser, requireAuth, requireAdmin, guest } from '../../../src/middleware/auth.js';
import { prisma } from '../../../lib/prisma.js';

describe('auth middleware', () => {
  let req: ReturnType<typeof createMockRequest>;
  let res: ReturnType<typeof createMockResponse>;
  let next: ReturnType<typeof createMockNext>;

  beforeEach(() => {
    vi.clearAllMocks();
    req = createMockRequest();
    res = createMockResponse();
    next = createMockNext();
  });

  describe('loadUser', () => {
    it('sets default values when no user session', async () => {
      await loadUser(req as any, res as any, next);

      expect(res.locals.user).toBeNull();
      expect(res.locals.isAdmin).toBe(false);
      expect(res.locals.appName).toBe('Test App');
      expect(next).toHaveBeenCalled();
    });

    it('loads user from session', async () => {
      const mockUser = { id: 1, name: 'Test User', email: 'test@test.com' };
      req.session.userId = 1;
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      await loadUser(req as any, res as any, next);

      expect(req.user).toEqual(mockUser);
      expect(res.locals.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
    });

    it('sets isAdmin for admin user', async () => {
      const mockUser = { id: 1, name: 'Admin', email: 'admin@test.com' };
      req.session.userId = 1;
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      await loadUser(req as any, res as any, next);

      expect(res.locals.isAdmin).toBe(true);
    });

    it('does not set user if not found in database', async () => {
      req.session.userId = 999;
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await loadUser(req as any, res as any, next);

      expect(req.user).toBeUndefined();
      expect(res.locals.user).toBeNull();
    });
  });

  describe('requireAuth', () => {
    it('calls next when user is authenticated', () => {
      req.user = { id: 1, name: 'Test' } as any;

      requireAuth(req as any, res as any, next);

      expect(next).toHaveBeenCalled();
      expect(res.redirect).not.toHaveBeenCalled();
    });

    it('redirects to login when not authenticated', () => {
      req.user = undefined;

      requireAuth(req as any, res as any, next);

      expect(res.redirect).toHaveBeenCalledWith('/login');
      expect(next).not.toHaveBeenCalled();
    });

    it('sets flash error message when redirecting', () => {
      req.user = undefined;

      requireAuth(req as any, res as any, next);

      expect(req.session.flash?.error).toContain('Please login to continue.');
    });
  });

  describe('requireAdmin', () => {
    it('calls next for admin user', () => {
      req.user = { id: 1, email: 'admin@test.com' } as any;

      requireAdmin(req as any, res as any, next);

      expect(next).toHaveBeenCalled();
    });

    it('redirects to login when not authenticated', () => {
      req.user = undefined;

      requireAdmin(req as any, res as any, next);

      expect(res.redirect).toHaveBeenCalledWith('/login');
    });

    it('renders 403 for non-admin user', () => {
      req.user = { id: 1, email: 'user@test.com' } as any;

      requireAdmin(req as any, res as any, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.render).toHaveBeenCalledWith('errors/403', { message: 'Access denied' });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('guest', () => {
    it('calls next when no user is authenticated', () => {
      req.user = undefined;

      guest(req as any, res as any, next);

      expect(next).toHaveBeenCalled();
      expect(res.redirect).not.toHaveBeenCalled();
    });

    it('redirects to home when user is authenticated', () => {
      req.user = { id: 1 } as any;

      guest(req as any, res as any, next);

      expect(res.redirect).toHaveBeenCalledWith('/');
      expect(next).not.toHaveBeenCalled();
    });
  });
});
