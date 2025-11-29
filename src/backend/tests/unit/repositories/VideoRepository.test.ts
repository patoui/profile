import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../lib/prisma.js', () => ({
  prisma: {
    video: {
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

import { VideoRepository } from '../../../repositories/VideoRepository.js';
import { prisma } from '../../../lib/prisma.js';

describe('VideoRepository', () => {
  let repository: VideoRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new VideoRepository();
  });

  describe('findAll', () => {
    it('returns all videos ordered by createdAt desc', async () => {
      const mockVideos = [
        { id: 1, title: 'Video 1', createdAt: new Date() },
        { id: 2, title: 'Video 2', createdAt: new Date() },
      ];
      vi.mocked(prisma.video.findMany).mockResolvedValue(mockVideos as any);

      const result = await repository.findAll();

      expect(result).toEqual(mockVideos);
      expect(prisma.video.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findPublished', () => {
    it('returns published videos', async () => {
      const mockVideos = [
        { id: 1, title: 'Video 1', publishedAt: new Date(), tags: '[]' },
      ];
      vi.mocked(prisma.video.findMany).mockResolvedValue(mockVideos as any);

      const result = await repository.findPublished();

      expect(result).toEqual(mockVideos);
    });

    it('filters by tag when provided', async () => {
      const mockVideos = [
        { id: 1, title: 'Video 1', publishedAt: new Date(), tags: '["tutorial"]' },
        { id: 2, title: 'Video 2', publishedAt: new Date(), tags: '["review"]' },
      ];
      vi.mocked(prisma.video.findMany).mockResolvedValue(mockVideos as any);

      const result = await repository.findPublished('tutorial');

      expect(result).toHaveLength(1);
      expect(result[0]?.title).toBe('Video 1');
    });
  });

  describe('findBySlug', () => {
    it('returns video by slug', async () => {
      const mockVideo = { id: 1, slug: 'test-video', title: 'Test Video' };
      vi.mocked(prisma.video.findUnique).mockResolvedValue(mockVideo as any);

      const result = await repository.findBySlug('test-video');

      expect(result).toEqual(mockVideo);
    });
  });

  describe('findById', () => {
    it('returns video by id', async () => {
      const mockVideo = { id: 1, title: 'Test Video' };
      vi.mocked(prisma.video.findUnique).mockResolvedValue(mockVideo as any);

      const result = await repository.findById(1);

      expect(result).toEqual(mockVideo);
    });
  });

  describe('create', () => {
    it('creates a video with generated slug', async () => {
      const mockVideo = {
        id: 1,
        title: 'Test Video',
        slug: 'test-video',
        description: 'Desc',
        externalId: 'abc123',
        tags: '[]',
      };
      vi.mocked(prisma.video.create).mockResolvedValue(mockVideo as any);

      const result = await repository.create({
        title: 'Test Video',
        description: 'Desc',
        externalId: 'abc123',
        tags: [],
      });

      expect(result).toEqual(mockVideo);
      expect(prisma.video.create).toHaveBeenCalledWith({
        data: {
          title: 'Test Video',
          slug: 'test-video',
          description: 'Desc',
          externalId: 'abc123',
          tags: '[]',
        },
      });
    });
  });

  describe('update', () => {
    it('updates a video', async () => {
      const mockVideo = {
        id: 1,
        title: 'Updated',
        description: 'New desc',
        externalId: 'xyz789',
        tags: '[]',
      };
      vi.mocked(prisma.video.update).mockResolvedValue(mockVideo as any);

      const result = await repository.update(1, {
        title: 'Updated',
        description: 'New desc',
        externalId: 'xyz789',
      });

      expect(result).toEqual(mockVideo);
    });
  });

  describe('togglePublish', () => {
    it('publishes an unpublished video', async () => {
      const mockVideo = { id: 1, publishedAt: null };
      vi.mocked(prisma.video.findUnique).mockResolvedValue(mockVideo as any);
      vi.mocked(prisma.video.update).mockResolvedValue({ ...mockVideo, publishedAt: new Date() } as any);

      await repository.togglePublish(1);

      expect(prisma.video.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { publishedAt: expect.any(Date) },
      });
    });

    it('throws when video not found', async () => {
      vi.mocked(prisma.video.findUnique).mockResolvedValue(null);

      await expect(repository.togglePublish(999)).rejects.toThrow('Video not found');
    });
  });

  describe('delete', () => {
    it('deletes a video', async () => {
      vi.mocked(prisma.video.delete).mockResolvedValue({ id: 1 } as any);

      await repository.delete(1);

      expect(prisma.video.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });

  describe('getPreviousPublished', () => {
    it('returns previous published video', async () => {
      const currentVideo = { id: 2, publishedAt: new Date('2024-01-15') };
      const previousVideo = { id: 1, publishedAt: new Date('2024-01-10') };
      vi.mocked(prisma.video.findFirst).mockResolvedValue(previousVideo as any);

      const result = await repository.getPreviousPublished(currentVideo as any);

      expect(result).toEqual(previousVideo);
    });

    it('returns null for unpublished video', async () => {
      const currentVideo = { id: 1, publishedAt: null };

      const result = await repository.getPreviousPublished(currentVideo as any);

      expect(result).toBeNull();
    });
  });

  describe('getNextPublished', () => {
    it('returns next published video', async () => {
      const currentVideo = { id: 1, publishedAt: new Date('2024-01-10') };
      const nextVideo = { id: 2, publishedAt: new Date('2024-01-15') };
      vi.mocked(prisma.video.findFirst).mockResolvedValue(nextVideo as any);

      const result = await repository.getNextPublished(currentVideo as any);

      expect(result).toEqual(nextVideo);
    });
  });

  describe('countAll', () => {
    it('returns total count', async () => {
      vi.mocked(prisma.video.count).mockResolvedValue(10);

      const result = await repository.countAll();

      expect(result).toBe(10);
    });
  });

  describe('countPublished', () => {
    it('returns published count', async () => {
      vi.mocked(prisma.video.count).mockResolvedValue(5);

      const result = await repository.countPublished();

      expect(result).toBe(5);
    });
  });
});
