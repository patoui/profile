import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockRequest, createMockResponse } from '../../../setup.js';

vi.mock('../../../../src/repositories/index.js', () => ({
  postRepository: {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    togglePublish: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../../../../lib/prisma.js', () => ({
  prisma: {
    post: { findMany: vi.fn() },
    tip: { findMany: vi.fn() },
    video: { findMany: vi.fn() },
  },
}));

import { AdminPostController } from '../../../../src/controllers/admin/PostController.js';
import { postRepository } from '../../../../src/repositories/index.js';
import { prisma } from '../../../../lib/prisma.js';

describe('AdminPostController', () => {
  let controller: AdminPostController;
  let req: ReturnType<typeof createMockRequest>;
  let res: ReturnType<typeof createMockResponse>;

  beforeEach(() => {
    vi.clearAllMocks();
    controller = new AdminPostController();
    req = createMockRequest();
    res = createMockResponse();
  });

  describe('index', () => {
    it('renders posts list', async () => {
      const mockPosts = [
        { id: 1, title: 'Post 1', tags: '["js"]' },
        { id: 2, title: 'Post 2', tags: '[]' },
      ];
      vi.mocked(postRepository.findAll).mockResolvedValue(mockPosts as any);

      await controller.index(req as any, res as any);

      expect(res.render).toHaveBeenCalledWith('admin/posts/index', expect.objectContaining({
        title: 'Manage Posts',
      }));
    });
  });

  describe('create', () => {
    it('renders create form with available tags', async () => {
      vi.mocked(prisma.post.findMany).mockResolvedValue([{ tags: '["js"]' }] as any);
      vi.mocked(prisma.tip.findMany).mockResolvedValue([]);
      vi.mocked(prisma.video.findMany).mockResolvedValue([]);

      await controller.create(req as any, res as any);

      expect(res.render).toHaveBeenCalledWith('admin/posts/create', expect.objectContaining({
        title: 'Create Post',
        errors: {},
        old: {},
      }));
    });
  });

  describe('store', () => {
    it('creates post and redirects on success', async () => {
      req.body = { title: 'New Post', body: 'Post body', tags: ['js'] };
      vi.mocked(postRepository.create).mockResolvedValue({ id: 1 } as any);

      await controller.store(req as any, res as any);

      expect(postRepository.create).toHaveBeenCalledWith({
        title: 'New Post',
        body: 'Post body',
        tags: ['js'],
      });
      expect(req.session.flash).toEqual({ success: ['Post created successfully'] });
      expect(res.redirect).toHaveBeenCalledWith('/admin/posts');
    });

    it('renders errors when title is missing', async () => {
      req.body = { body: 'Body' };
      vi.mocked(prisma.post.findMany).mockResolvedValue([]);
      vi.mocked(prisma.tip.findMany).mockResolvedValue([]);
      vi.mocked(prisma.video.findMany).mockResolvedValue([]);

      await controller.store(req as any, res as any);

      expect(res.render).toHaveBeenCalledWith('admin/posts/create', expect.objectContaining({
        errors: expect.objectContaining({ title: 'Title is required' }),
      }));
    });

    it('renders errors when body is missing', async () => {
      req.body = { title: 'Title' };
      vi.mocked(prisma.post.findMany).mockResolvedValue([]);
      vi.mocked(prisma.tip.findMany).mockResolvedValue([]);
      vi.mocked(prisma.video.findMany).mockResolvedValue([]);

      await controller.store(req as any, res as any);

      expect(res.render).toHaveBeenCalledWith('admin/posts/create', expect.objectContaining({
        errors: expect.objectContaining({ body: 'Body is required' }),
      }));
    });

    it('handles single tag as array', async () => {
      req.body = { title: 'Post', body: 'Body', tags: 'singletag' };
      vi.mocked(postRepository.create).mockResolvedValue({ id: 1 } as any);

      await controller.store(req as any, res as any);

      expect(postRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        tags: ['singletag'],
      }));
    });
  });

  describe('edit', () => {
    it('renders edit form for existing post', async () => {
      req.params = { id: '1' };
      const mockPost = { id: 1, title: 'Post', body: 'Body', tags: '["js"]' };
      vi.mocked(postRepository.findById).mockResolvedValue(mockPost as any);
      vi.mocked(prisma.post.findMany).mockResolvedValue([]);
      vi.mocked(prisma.tip.findMany).mockResolvedValue([]);
      vi.mocked(prisma.video.findMany).mockResolvedValue([]);

      await controller.edit(req as any, res as any);

      expect(res.render).toHaveBeenCalledWith('admin/posts/edit', expect.objectContaining({
        title: 'Edit Post',
        post: expect.objectContaining({ id: 1 }),
      }));
    });

    it('renders 404 when post not found', async () => {
      req.params = { id: '999' };
      vi.mocked(postRepository.findById).mockResolvedValue(null);

      await controller.edit(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.render).toHaveBeenCalledWith('errors/404', { message: 'Post not found' });
    });

    it('renders 404 when id is missing', async () => {
      req.params = {};

      await controller.edit(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('update', () => {
    it('updates post and redirects on success', async () => {
      req.params = { id: '1' };
      req.body = { title: 'Updated', body: 'New body', tags: ['ts'] };
      vi.mocked(postRepository.findById).mockResolvedValue({ id: 1 } as any);
      vi.mocked(postRepository.update).mockResolvedValue({ id: 1 } as any);

      await controller.update(req as any, res as any);

      expect(postRepository.update).toHaveBeenCalledWith(1, {
        title: 'Updated',
        body: 'New body',
        tags: ['ts'],
      });
      expect(res.redirect).toHaveBeenCalledWith('/admin/posts');
    });

    it('renders 404 when post not found', async () => {
      req.params = { id: '999' };
      req.body = { title: 'Title', body: 'Body' };
      vi.mocked(postRepository.findById).mockResolvedValue(null);

      await controller.update(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('togglePublish', () => {
    it('toggles publish status and redirects', async () => {
      req.params = { id: '1' };
      vi.mocked(postRepository.findById).mockResolvedValue({ id: 1, publishedAt: null } as any);
      vi.mocked(postRepository.togglePublish).mockResolvedValue({ id: 1, publishedAt: new Date() } as any);

      await controller.togglePublish(req as any, res as any);

      expect(postRepository.togglePublish).toHaveBeenCalledWith(1);
      expect(res.redirect).toHaveBeenCalledWith('/admin/posts');
    });

    it('shows correct flash message when publishing', async () => {
      req.params = { id: '1' };
      vi.mocked(postRepository.findById).mockResolvedValue({ id: 1, publishedAt: null } as any);
      vi.mocked(postRepository.togglePublish).mockResolvedValue({ id: 1 } as any);

      await controller.togglePublish(req as any, res as any);

      expect(req.session.flash?.success).toContain('Post published successfully');
    });

    it('shows correct flash message when unpublishing', async () => {
      req.params = { id: '1' };
      vi.mocked(postRepository.findById).mockResolvedValue({ id: 1, publishedAt: new Date() } as any);
      vi.mocked(postRepository.togglePublish).mockResolvedValue({ id: 1 } as any);

      await controller.togglePublish(req as any, res as any);

      expect(req.session.flash?.success).toContain('Post unpublished successfully');
    });
  });

  describe('destroy', () => {
    it('deletes post and redirects', async () => {
      req.params = { id: '1' };
      vi.mocked(postRepository.delete).mockResolvedValue(undefined);

      await controller.destroy(req as any, res as any);

      expect(postRepository.delete).toHaveBeenCalledWith(1);
      expect(req.session.flash?.success).toContain('Post deleted successfully');
      expect(res.redirect).toHaveBeenCalledWith('/admin/posts');
    });
  });
});
