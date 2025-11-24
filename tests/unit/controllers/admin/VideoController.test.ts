import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockRequest, createMockResponse } from '../../../setup.js';

vi.mock('../../../../src/repositories/index.js', () => ({
  videoRepository: {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    togglePublish: vi.fn(),
    delete: vi.fn(),
  },
}));

import { AdminVideoController } from '../../../../src/controllers/admin/VideoController.js';
import { videoRepository } from '../../../../src/repositories/index.js';

describe('AdminVideoController', () => {
  let controller: AdminVideoController;
  let req: ReturnType<typeof createMockRequest>;
  let res: ReturnType<typeof createMockResponse>;

  beforeEach(() => {
    vi.clearAllMocks();
    controller = new AdminVideoController();
    req = createMockRequest();
    res = createMockResponse();
  });

  describe('index', () => {
    it('renders videos list', async () => {
      const mockVideos = [
        { id: 1, title: 'Video 1', tags: '["tutorial"]' },
      ];
      vi.mocked(videoRepository.findAll).mockResolvedValue(mockVideos as any);

      await controller.index(req as any, res as any);

      expect(res.render).toHaveBeenCalledWith('admin/videos/index', expect.objectContaining({
        title: 'Manage Videos',
      }));
    });
  });

  describe('create', () => {
    it('renders create form', async () => {
      await controller.create(req as any, res as any);

      expect(res.render).toHaveBeenCalledWith('admin/videos/create', {
        title: 'Create Video',
        errors: {},
        old: {},
      });
    });
  });

  describe('store', () => {
    it('creates video and redirects on success', async () => {
      req.body = {
        title: 'New Video',
        description: 'Video description',
        externalId: 'abc123',
        tags: ['tutorial'],
      };
      vi.mocked(videoRepository.create).mockResolvedValue({ id: 1 } as any);

      await controller.store(req as any, res as any);

      expect(videoRepository.create).toHaveBeenCalledWith({
        title: 'New Video',
        description: 'Video description',
        externalId: 'abc123',
        tags: ['tutorial'],
      });
      expect(res.redirect).toHaveBeenCalledWith('/admin/videos');
    });

    it('renders errors when validation fails', async () => {
      req.body = { title: '', description: '', externalId: '' };

      await controller.store(req as any, res as any);

      expect(res.render).toHaveBeenCalledWith('admin/videos/create', expect.objectContaining({
        errors: expect.objectContaining({
          title: 'Title is required',
          description: 'Description is required',
          externalId: 'YouTube Video ID is required',
        }),
      }));
    });
  });

  describe('edit', () => {
    it('renders edit form for existing video', async () => {
      req.params = { id: '1' };
      vi.mocked(videoRepository.findById).mockResolvedValue({
        id: 1,
        title: 'Video',
        description: 'Desc',
        externalId: 'abc',
        tags: '[]',
      } as any);

      await controller.edit(req as any, res as any);

      expect(res.render).toHaveBeenCalledWith('admin/videos/edit', expect.objectContaining({
        title: 'Edit Video',
      }));
    });

    it('renders 404 when video not found', async () => {
      req.params = { id: '999' };
      vi.mocked(videoRepository.findById).mockResolvedValue(null);

      await controller.edit(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('update', () => {
    it('updates video and redirects on success', async () => {
      req.params = { id: '1' };
      req.body = {
        title: 'Updated',
        description: 'New desc',
        externalId: 'xyz789',
      };
      vi.mocked(videoRepository.findById).mockResolvedValue({ id: 1 } as any);
      vi.mocked(videoRepository.update).mockResolvedValue({ id: 1 } as any);

      await controller.update(req as any, res as any);

      expect(videoRepository.update).toHaveBeenCalledWith(1, expect.objectContaining({
        title: 'Updated',
        description: 'New desc',
        externalId: 'xyz789',
      }));
      expect(res.redirect).toHaveBeenCalledWith('/admin/videos');
    });

    it('renders errors when validation fails', async () => {
      req.params = { id: '1' };
      req.body = { title: '', description: '', externalId: '' };
      vi.mocked(videoRepository.findById).mockResolvedValue({ id: 1, tags: '[]' } as any);

      await controller.update(req as any, res as any);

      expect(res.render).toHaveBeenCalledWith('admin/videos/edit', expect.objectContaining({
        errors: expect.objectContaining({
          title: 'Title is required',
        }),
      }));
    });
  });

  describe('togglePublish', () => {
    it('toggles publish status', async () => {
      req.params = { id: '1' };
      vi.mocked(videoRepository.findById).mockResolvedValue({ id: 1, publishedAt: null } as any);
      vi.mocked(videoRepository.togglePublish).mockResolvedValue({ id: 1 } as any);

      await controller.togglePublish(req as any, res as any);

      expect(videoRepository.togglePublish).toHaveBeenCalledWith(1);
      expect(res.redirect).toHaveBeenCalledWith('/admin/videos');
    });
  });

  describe('destroy', () => {
    it('deletes video and redirects', async () => {
      req.params = { id: '1' };

      await controller.destroy(req as any, res as any);

      expect(videoRepository.delete).toHaveBeenCalledWith(1);
      expect(res.redirect).toHaveBeenCalledWith('/admin/videos');
    });
  });
});
