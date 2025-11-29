import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockRequest, createMockResponse } from '../../../setup.js';

vi.mock('../../../../repositories/index.js', () => ({
  tipRepository: {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    togglePublish: vi.fn(),
    delete: vi.fn(),
  },
}));

import { AdminTipController } from '../../../../controllers/admin/TipController.js';
import { tipRepository } from '../../../../repositories/index.js';

describe('AdminTipController', () => {
  let controller: AdminTipController;
  let req: ReturnType<typeof createMockRequest>;
  let res: ReturnType<typeof createMockResponse>;

  beforeEach(() => {
    vi.clearAllMocks();
    controller = new AdminTipController();
    req = createMockRequest();
    res = createMockResponse();
  });

  describe('index', () => {
    it('renders tips list', async () => {
      const mockTips = [
        { id: 1, title: 'Tip 1', tags: '["vim"]' },
      ];
      vi.mocked(tipRepository.findAll).mockResolvedValue(mockTips as any);

      await controller.index(req as any, res as any);

      expect(res.render).toHaveBeenCalledWith('admin/tips/index', expect.objectContaining({
        title: 'Manage Tips',
      }));
    });
  });

  describe('create', () => {
    it('renders create form', async () => {
      await controller.create(req as any, res as any);

      expect(res.render).toHaveBeenCalledWith('admin/tips/create', {
        title: 'Create Tip',
        errors: {},
        old: {},
      });
    });
  });

  describe('store', () => {
    it('creates tip and redirects on success', async () => {
      req.body = { title: 'New Tip', body: 'Tip body', tags: ['vim'] };
      vi.mocked(tipRepository.create).mockResolvedValue({ id: 1 } as any);

      await controller.store(req as any, res as any);

      expect(tipRepository.create).toHaveBeenCalledWith({
        title: 'New Tip',
        body: 'Tip body',
        tags: ['vim'],
      });
      expect(res.redirect).toHaveBeenCalledWith('/admin/tips');
    });

    it('renders errors when validation fails', async () => {
      req.body = { title: '', body: '' };

      await controller.store(req as any, res as any);

      expect(res.render).toHaveBeenCalledWith('admin/tips/create', expect.objectContaining({
        errors: expect.objectContaining({
          title: 'Title is required',
          body: 'Body is required',
        }),
      }));
    });
  });

  describe('edit', () => {
    it('renders edit form for existing tip', async () => {
      req.params = { id: '1' };
      vi.mocked(tipRepository.findById).mockResolvedValue({ id: 1, title: 'Tip', tags: '[]' } as any);

      await controller.edit(req as any, res as any);

      expect(res.render).toHaveBeenCalledWith('admin/tips/edit', expect.objectContaining({
        title: 'Edit Tip',
      }));
    });

    it('renders 404 when tip not found', async () => {
      req.params = { id: '999' };
      vi.mocked(tipRepository.findById).mockResolvedValue(null);

      await controller.edit(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('update', () => {
    it('updates tip and redirects on success', async () => {
      req.params = { id: '1' };
      req.body = { title: 'Updated', body: 'New body' };
      vi.mocked(tipRepository.findById).mockResolvedValue({ id: 1 } as any);
      vi.mocked(tipRepository.update).mockResolvedValue({ id: 1 } as any);

      await controller.update(req as any, res as any);

      expect(tipRepository.update).toHaveBeenCalledWith(1, expect.objectContaining({
        title: 'Updated',
        body: 'New body',
      }));
      expect(res.redirect).toHaveBeenCalledWith('/admin/tips');
    });
  });

  describe('togglePublish', () => {
    it('toggles publish status', async () => {
      req.params = { id: '1' };
      vi.mocked(tipRepository.findById).mockResolvedValue({ id: 1, publishedAt: null } as any);
      vi.mocked(tipRepository.togglePublish).mockResolvedValue({ id: 1 } as any);

      await controller.togglePublish(req as any, res as any);

      expect(tipRepository.togglePublish).toHaveBeenCalledWith(1);
      expect(res.redirect).toHaveBeenCalledWith('/admin/tips');
    });
  });

  describe('destroy', () => {
    it('deletes tip and redirects', async () => {
      req.params = { id: '1' };

      await controller.destroy(req as any, res as any);

      expect(tipRepository.delete).toHaveBeenCalledWith(1);
      expect(res.redirect).toHaveBeenCalledWith('/admin/tips');
    });
  });
});
