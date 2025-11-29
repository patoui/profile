import { vi } from 'vitest';

// Mock environment variables
process.env['ADMIN_EMAIL'] = 'admin@test.com';
process.env['APP_NAME'] = 'Test App';
process.env['BASE_URL'] = 'http://localhost:3000';

// Global test utilities
export const createMockRequest = (overrides = {}) => ({
  body: {},
  params: {},
  query: {},
  session: {
    userId: undefined as number | undefined,
    flash: undefined as any,
    destroy: vi.fn((cb) => cb()),
  },
  user: undefined as any,
  get: vi.fn(),
  ip: '127.0.0.1',
  socket: { remoteAddress: '127.0.0.1' },
  ...overrides,
});

export const createMockResponse = () => {
  const res = {
    locals: {
      user: undefined,
      isAdmin: false,
      appName: 'Test App',
      flash: { success: [], error: [], info: [] },
      setFlash: undefined as any,
    },
    status: vi.fn(),
    render: vi.fn(),
    redirect: vi.fn(),
    send: vi.fn(),
    set: vi.fn(),
  };
  res.status.mockReturnValue(res);
  res.render.mockReturnValue(res);
  res.redirect.mockReturnValue(res);
  res.send.mockReturnValue(res);
  res.set.mockReturnValue(res);
  return res;
};

export const createMockNext = () => vi.fn();
