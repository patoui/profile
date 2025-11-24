import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../lib/prisma.js', () => ({
  prisma: {
    post: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
  },
}));

import { PostRepository } from '../../../src/repositories/PostRepository.js';
import { prisma } from '../../../lib/prisma.js';

describe('PostRepository', () => {
  let repository: PostRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new PostRepository();
  });

  describe('findAll', () => {
    it('returns all posts ordered by createdAt desc', async () => {
      const mockPosts = [
        { id: 1, title: 'Post 1', createdAt: new Date() },
        { id: 2, title: 'Post 2', createdAt: new Date() },
      ];
      vi.mocked(prisma.post.findMany).mockResolvedValue(mockPosts as any);

      const result = await repository.findAll();

      expect(result).toEqual(mockPosts);
      expect(prisma.post.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findPublished', () => {
    it('returns published posts', async () => {
      const mockPosts = [
        { id: 1, title: 'Post 1', publishedAt: new Date(), tags: '[]' },
      ];
      vi.mocked(prisma.post.findMany).mockResolvedValue(mockPosts as any);

      const result = await repository.findPublished();

      expect(result).toEqual(mockPosts);
      expect(prisma.post.findMany).toHaveBeenCalledWith({
        where: { publishedAt: { not: null, lte: expect.any(Date) } },
        orderBy: { publishedAt: 'desc' },
      });
    });

    it('filters by tag when provided', async () => {
      const mockPosts = [
        { id: 1, title: 'Post 1', publishedAt: new Date(), tags: '["javascript"]' },
        { id: 2, title: 'Post 2', publishedAt: new Date(), tags: '["python"]' },
      ];
      vi.mocked(prisma.post.findMany).mockResolvedValue(mockPosts as any);

      const result = await repository.findPublished('javascript');

      expect(result).toHaveLength(1);
      expect(result[0]?.title).toBe('Post 1');
    });
  });

  describe('findBySlug', () => {
    it('returns post by slug', async () => {
      const mockPost = { id: 1, slug: 'test-post', title: 'Test Post' };
      vi.mocked(prisma.post.findUnique).mockResolvedValue(mockPost as any);

      const result = await repository.findBySlug('test-post');

      expect(result).toEqual(mockPost);
      expect(prisma.post.findUnique).toHaveBeenCalledWith({
        where: { slug: 'test-post' },
      });
    });

    it('returns null when not found', async () => {
      vi.mocked(prisma.post.findUnique).mockResolvedValue(null);

      const result = await repository.findBySlug('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('returns post by id', async () => {
      const mockPost = { id: 1, title: 'Test Post' };
      vi.mocked(prisma.post.findUnique).mockResolvedValue(mockPost as any);

      const result = await repository.findById(1);

      expect(result).toEqual(mockPost);
      expect(prisma.post.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });

  describe('create', () => {
    it('creates a post with generated slug', async () => {
      const mockPost = { id: 1, title: 'Test Post', slug: 'test-post', body: 'Body', tags: '[]' };
      vi.mocked(prisma.post.create).mockResolvedValue(mockPost as any);

      const result = await repository.create({
        title: 'Test Post',
        body: 'Body',
        tags: [],
      });

      expect(result).toEqual(mockPost);
      expect(prisma.post.create).toHaveBeenCalledWith({
        data: {
          title: 'Test Post',
          slug: 'test-post',
          body: 'Body',
          tags: '[]',
        },
      });
    });

    it('creates post with tags', async () => {
      const mockPost = { id: 1, title: 'Test', slug: 'test', body: 'Body', tags: '["js","ts"]' };
      vi.mocked(prisma.post.create).mockResolvedValue(mockPost as any);

      await repository.create({
        title: 'Test',
        body: 'Body',
        tags: ['js', 'ts'],
      });

      expect(prisma.post.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tags: '["js","ts"]',
        }),
      });
    });
  });

  describe('update', () => {
    it('updates a post', async () => {
      const mockPost = { id: 1, title: 'Updated', body: 'New body', tags: '[]' };
      vi.mocked(prisma.post.update).mockResolvedValue(mockPost as any);

      const result = await repository.update(1, {
        title: 'Updated',
        body: 'New body',
      });

      expect(result).toEqual(mockPost);
      expect(prisma.post.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { title: 'Updated', body: 'New body' },
      });
    });

    it('updates tags when provided', async () => {
      const mockPost = { id: 1, title: 'Test', body: 'Body', tags: '["new"]' };
      vi.mocked(prisma.post.update).mockResolvedValue(mockPost as any);

      await repository.update(1, {
        title: 'Test',
        body: 'Body',
        tags: ['new'],
      });

      expect(prisma.post.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { title: 'Test', body: 'Body', tags: '["new"]' },
      });
    });
  });

  describe('togglePublish', () => {
    it('publishes an unpublished post', async () => {
      const mockPost = { id: 1, publishedAt: null };
      vi.mocked(prisma.post.findUnique).mockResolvedValue(mockPost as any);
      vi.mocked(prisma.post.update).mockResolvedValue({ ...mockPost, publishedAt: new Date() } as any);

      await repository.togglePublish(1);

      expect(prisma.post.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { publishedAt: expect.any(Date) },
      });
    });

    it('unpublishes a published post', async () => {
      const mockPost = { id: 1, publishedAt: new Date() };
      vi.mocked(prisma.post.findUnique).mockResolvedValue(mockPost as any);
      vi.mocked(prisma.post.update).mockResolvedValue({ ...mockPost, publishedAt: null } as any);

      await repository.togglePublish(1);

      expect(prisma.post.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { publishedAt: null },
      });
    });

    it('throws when post not found', async () => {
      vi.mocked(prisma.post.findUnique).mockResolvedValue(null);

      await expect(repository.togglePublish(999)).rejects.toThrow('Post not found');
    });
  });

  describe('delete', () => {
    it('deletes a post', async () => {
      vi.mocked(prisma.post.delete).mockResolvedValue({ id: 1 } as any);

      await repository.delete(1);

      expect(prisma.post.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });

  describe('getPreviousPublished', () => {
    it('returns previous published post', async () => {
      const currentPost = { id: 2, publishedAt: new Date('2024-01-15') };
      const previousPost = { id: 1, publishedAt: new Date('2024-01-10') };
      vi.mocked(prisma.post.findFirst).mockResolvedValue(previousPost as any);

      const result = await repository.getPreviousPublished(currentPost as any);

      expect(result).toEqual(previousPost);
      expect(prisma.post.findFirst).toHaveBeenCalledWith({
        where: { publishedAt: { not: null, lt: currentPost.publishedAt } },
        orderBy: { publishedAt: 'desc' },
      });
    });

    it('returns null for unpublished post', async () => {
      const currentPost = { id: 1, publishedAt: null };

      const result = await repository.getPreviousPublished(currentPost as any);

      expect(result).toBeNull();
    });
  });

  describe('getNextPublished', () => {
    it('returns next published post', async () => {
      const currentPost = { id: 1, publishedAt: new Date('2024-01-10') };
      const nextPost = { id: 2, publishedAt: new Date('2024-01-15') };
      vi.mocked(prisma.post.findFirst).mockResolvedValue(nextPost as any);

      const result = await repository.getNextPublished(currentPost as any);

      expect(result).toEqual(nextPost);
      expect(prisma.post.findFirst).toHaveBeenCalledWith({
        where: { publishedAt: { not: null, gt: currentPost.publishedAt } },
        orderBy: { publishedAt: 'asc' },
      });
    });

    it('returns null for unpublished post', async () => {
      const currentPost = { id: 1, publishedAt: null };

      const result = await repository.getNextPublished(currentPost as any);

      expect(result).toBeNull();
    });
  });

  describe('countAll', () => {
    it('returns total count', async () => {
      vi.mocked(prisma.post.count).mockResolvedValue(10);

      const result = await repository.countAll();

      expect(result).toBe(10);
      expect(prisma.post.count).toHaveBeenCalled();
    });
  });

  describe('countPublished', () => {
    it('returns published count', async () => {
      vi.mocked(prisma.post.count).mockResolvedValue(5);

      const result = await repository.countPublished();

      expect(result).toBe(5);
      expect(prisma.post.count).toHaveBeenCalledWith({
        where: { publishedAt: { not: null, lte: expect.any(Date) } },
      });
    });
  });
});
