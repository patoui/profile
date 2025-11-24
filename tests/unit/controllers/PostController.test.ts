import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockRequest, createMockResponse } from '../../setup.js';

vi.mock('../../../src/repositories/index.js', () => ({
  postRepository: {
    findPublished: vi.fn(),
    findBySlug: vi.fn(),
    getPreviousPublished: vi.fn(),
    getNextPublished: vi.fn(),
  },
  analyticRepository: {
    record: vi.fn(),
  },
}));

import { PostController } from '../../../src/controllers/PostController.js';
import { postRepository, analyticRepository } from '../../../src/repositories/index.js';

describe('PostController', () => {
  let controller: PostController;
  let req: ReturnType<typeof createMockRequest>;
  let res: ReturnType<typeof createMockResponse>;

  beforeEach(() => {
    vi.clearAllMocks();
    controller = new PostController();
    req = createMockRequest();
    res = createMockResponse();
  });

  describe('index', () => {
    it('renders posts index with posts and tags', async () => {
      const mockPosts = [
        { id: 1, title: 'Post 1', body: 'Body 1', tags: '["javascript"]', publishedAt: new Date() },
        { id: 2, title: 'Post 2', body: 'Body 2', tags: '["python"]', publishedAt: new Date() },
      ];
      vi.mocked(postRepository.findPublished).mockResolvedValue(mockPosts as any);

      await controller.index(req as any, res as any);

      expect(res.render).toHaveBeenCalledWith('posts/index', expect.objectContaining({
        title: 'Articles',
        currentPath: '/blog',
        selectedTag: null,
      }));
    });

    it('filters by tag when provided', async () => {
      req.query = { tag: 'javascript' };
      vi.mocked(postRepository.findPublished).mockResolvedValue([]);

      await controller.index(req as any, res as any);

      expect(postRepository.findPublished).toHaveBeenCalledWith('javascript');
      expect(res.render).toHaveBeenCalledWith('posts/index', expect.objectContaining({
        selectedTag: 'javascript',
      }));
    });

    it('includes shortBody and tagNames for each post', async () => {
      const mockPosts = [
        { id: 1, title: 'Post 1', body: '**Bold** text', tags: '["js","ts"]', publishedAt: new Date() },
      ];
      vi.mocked(postRepository.findPublished).mockResolvedValue(mockPosts as any);

      await controller.index(req as any, res as any);

      const renderCall = (res.render as any).mock.calls[0];
      const posts = renderCall?.[1]?.posts;
      expect(posts[0]).toHaveProperty('shortBody');
      expect(posts[0]).toHaveProperty('tagNames');
      expect(posts[0].tagNames).toEqual(['js', 'ts']);
    });
  });

  describe('show', () => {
    it('renders post show page', async () => {
      const mockPost = {
        id: 1,
        title: 'Test Post',
        slug: 'test-post',
        body: '# Hello',
        tags: '["test"]',
        publishedAt: new Date(),
      };
      req.params = { slug: 'test-post' };
      vi.mocked(postRepository.findBySlug).mockResolvedValue(mockPost as any);
      vi.mocked(postRepository.getPreviousPublished).mockResolvedValue(null);
      vi.mocked(postRepository.getNextPublished).mockResolvedValue(null);

      await controller.show(req as any, res as any);

      expect(res.render).toHaveBeenCalledWith('posts/show', expect.objectContaining({
        title: 'Test Post',
        currentPath: '/blog',
      }));
    });

    it('records analytics when viewing post', async () => {
      const mockPost = {
        id: 1,
        title: 'Test Post',
        slug: 'test-post',
        body: 'Body',
        tags: '[]',
        publishedAt: new Date(),
      };
      req.params = { slug: 'test-post' };
      vi.mocked(postRepository.findBySlug).mockResolvedValue(mockPost as any);
      vi.mocked(postRepository.getPreviousPublished).mockResolvedValue(null);
      vi.mocked(postRepository.getNextPublished).mockResolvedValue(null);

      await controller.show(req as any, res as any);

      expect(analyticRepository.record).toHaveBeenCalledWith('post', 1, req);
    });

    it('renders 404 when post not found', async () => {
      req.params = { slug: 'nonexistent' };
      vi.mocked(postRepository.findBySlug).mockResolvedValue(null);

      await controller.show(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.render).toHaveBeenCalledWith('errors/404', { message: 'Post not found' });
    });

    it('renders 404 when post is not published', async () => {
      const mockPost = {
        id: 1,
        title: 'Draft Post',
        slug: 'draft-post',
        publishedAt: null,
      };
      req.params = { slug: 'draft-post' };
      vi.mocked(postRepository.findBySlug).mockResolvedValue(mockPost as any);

      await controller.show(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('renders 404 when slug is missing', async () => {
      req.params = {};

      await controller.show(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('includes previous and next posts', async () => {
      const mockPost = {
        id: 2,
        title: 'Current Post',
        slug: 'current-post',
        body: 'Body',
        tags: '[]',
        publishedAt: new Date(),
      };
      const prevPost = { id: 1, title: 'Previous' };
      const nextPost = { id: 3, title: 'Next' };

      req.params = { slug: 'current-post' };
      vi.mocked(postRepository.findBySlug).mockResolvedValue(mockPost as any);
      vi.mocked(postRepository.getPreviousPublished).mockResolvedValue(prevPost as any);
      vi.mocked(postRepository.getNextPublished).mockResolvedValue(nextPost as any);

      await controller.show(req as any, res as any);

      expect(res.render).toHaveBeenCalledWith('posts/show', expect.objectContaining({
        previousPost: prevPost,
        nextPost: nextPost,
      }));
    });
  });
});
