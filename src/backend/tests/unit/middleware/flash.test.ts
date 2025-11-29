import { describe, it, expect, beforeEach } from 'vitest';
import { flashMiddleware } from '../../../middleware/flash.js';
import { createMockRequest, createMockResponse, createMockNext } from '../../setup.js';

describe('flashMiddleware', () => {
  let req: ReturnType<typeof createMockRequest>;
  let res: ReturnType<typeof createMockResponse>;
  let next: ReturnType<typeof createMockNext>;

  beforeEach(() => {
    req = createMockRequest();
    res = createMockResponse();
    next = createMockNext();
  });

  it('initializes flash in locals with empty arrays', () => {
    flashMiddleware(req as any, res as any, next);

    expect(res.locals.flash).toEqual({
      success: [],
      error: [],
      info: [],
    });
  });

  it('copies flash messages from session to locals', () => {
    req.session.flash = {
      success: ['Success message'],
      error: ['Error message'],
      info: ['Info message'],
    };

    flashMiddleware(req as any, res as any, next);

    expect(res.locals.flash).toEqual({
      success: ['Success message'],
      error: ['Error message'],
      info: ['Info message'],
    });
  });

  it('clears flash from session after reading', () => {
    req.session.flash = {
      success: ['Success message'],
    };

    flashMiddleware(req as any, res as any, next);

    expect(req.session.flash).toBeUndefined();
  });

  it('handles partial flash data', () => {
    req.session.flash = {
      success: ['Only success'],
    };

    flashMiddleware(req as any, res as any, next);

    expect(res.locals.flash).toEqual({
      success: ['Only success'],
      error: [],
      info: [],
    });
  });

  it('provides setFlash helper function', () => {
    flashMiddleware(req as any, res as any, next);

    expect(typeof res.locals.setFlash).toBe('function');
  });

  it('setFlash adds messages to session', () => {
    flashMiddleware(req as any, res as any, next);

    res.locals.setFlash('success', 'New success message');

    expect(req.session.flash).toEqual({
      success: ['New success message'],
    });
  });

  it('setFlash accumulates messages', () => {
    flashMiddleware(req as any, res as any, next);

    res.locals.setFlash('error', 'Error 1');
    res.locals.setFlash('error', 'Error 2');

    expect(req.session.flash?.error).toEqual(['Error 1', 'Error 2']);
  });

  it('setFlash handles different types', () => {
    flashMiddleware(req as any, res as any, next);

    res.locals.setFlash('success', 'Success');
    res.locals.setFlash('error', 'Error');
    res.locals.setFlash('info', 'Info');

    expect(req.session.flash).toEqual({
      success: ['Success'],
      error: ['Error'],
      info: ['Info'],
    });
  });

  it('calls next', () => {
    flashMiddleware(req as any, res as any, next);

    expect(next).toHaveBeenCalled();
  });
});
