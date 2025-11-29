import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockRequest, createMockResponse } from '../../setup.js';

vi.mock('../../../repositories/index.js', () => ({
  postRepository: {
    findPublished: vi.fn(),
  },
  tipRepository: {
    findPublished: vi.fn(),
  },
  videoRepository: {
    findPublished: vi.fn(),
  },
}));

import { FeedController } from '../../../controllers/FeedController.js';
import { postRepository, tipRepository, videoRepository } from '../../../repositories/index.js';

describe('FeedController', () => {
  let controller: FeedController;
  let req: ReturnType<typeof createMockRequest>;
  let res: ReturnType<typeof createMockResponse>;

  beforeEach(() => {
    vi.clearAllMocks();
    controller = new FeedController();
    req = createMockRequest();
    res = createMockResponse();
  });

  describe('posts', () => {
    it('returns RSS feed for posts', async () => {
      const mockPosts = [
        {
          id: 1,
          title: 'Post 1',
          slug: 'post-1',
          body: 'Body content',
          publishedAt: new Date('2024-01-15'),
          createdAt: new Date('2024-01-15'),
        },
      ];
      vi.mocked(postRepository.findPublished).mockResolvedValue(mockPosts as any);

      await controller.posts(req as any, res as any);

      expect(res.set).toHaveBeenCalledWith('Content-Type', 'application/rss+xml');
      expect(res.send).toHaveBeenCalled();
      const rssContent = (res.send as any).mock.calls[0]?.[0];
      expect(rssContent).toContain('<rss');
      expect(rssContent).toContain('Post 1');
    });
  });

  describe('tips', () => {
    it('returns RSS feed for tips', async () => {
      const mockTips = [
        {
          id: 1,
          title: 'Tip 1',
          slug: 'tip-1',
          body: 'Tip content',
          publishedAt: new Date('2024-01-15'),
          createdAt: new Date('2024-01-15'),
        },
      ];
      vi.mocked(tipRepository.findPublished).mockResolvedValue(mockTips as any);

      await controller.tips(req as any, res as any);

      expect(res.set).toHaveBeenCalledWith('Content-Type', 'application/rss+xml');
      expect(res.send).toHaveBeenCalled();
      const rssContent = (res.send as any).mock.calls[0]?.[0];
      expect(rssContent).toContain('Tip 1');
    });
  });

  describe('videos', () => {
    it('returns RSS feed for videos', async () => {
      const mockVideos = [
        {
          id: 1,
          title: 'Video 1',
          slug: 'video-1',
          description: 'Video description',
          publishedAt: new Date('2024-01-15'),
          createdAt: new Date('2024-01-15'),
        },
      ];
      vi.mocked(videoRepository.findPublished).mockResolvedValue(mockVideos as any);

      await controller.videos(req as any, res as any);

      expect(res.set).toHaveBeenCalledWith('Content-Type', 'application/rss+xml');
      expect(res.send).toHaveBeenCalled();
      const rssContent = (res.send as any).mock.calls[0]?.[0];
      expect(rssContent).toContain('Video 1');
    });
  });

  describe('all', () => {
    it('returns combined RSS feed sorted by date', async () => {
      const mockPosts = [
        {
          id: 1,
          title: 'Post 1',
          slug: 'post-1',
          body: 'Body',
          publishedAt: new Date('2024-01-10'),
          createdAt: new Date('2024-01-10'),
        },
      ];
      const mockTips = [
        {
          id: 1,
          title: 'Tip 1',
          slug: 'tip-1',
          body: 'Body',
          publishedAt: new Date('2024-01-15'),
          createdAt: new Date('2024-01-15'),
        },
      ];
      const mockVideos = [
        {
          id: 1,
          title: 'Video 1',
          slug: 'video-1',
          description: 'Desc',
          publishedAt: new Date('2024-01-12'),
          createdAt: new Date('2024-01-12'),
        },
      ];

      vi.mocked(postRepository.findPublished).mockResolvedValue(mockPosts as any);
      vi.mocked(tipRepository.findPublished).mockResolvedValue(mockTips as any);
      vi.mocked(videoRepository.findPublished).mockResolvedValue(mockVideos as any);

      await controller.all(req as any, res as any);

      expect(res.set).toHaveBeenCalledWith('Content-Type', 'application/rss+xml');
      expect(res.send).toHaveBeenCalled();
      const rssContent = (res.send as any).mock.calls[0]?.[0];
      expect(rssContent).toContain('Post 1');
      expect(rssContent).toContain('Tip 1');
      expect(rssContent).toContain('Video 1');
    });

    it('handles empty content', async () => {
      vi.mocked(postRepository.findPublished).mockResolvedValue([]);
      vi.mocked(tipRepository.findPublished).mockResolvedValue([]);
      vi.mocked(videoRepository.findPublished).mockResolvedValue([]);

      await controller.all(req as any, res as any);

      expect(res.set).toHaveBeenCalledWith('Content-Type', 'application/rss+xml');
      expect(res.send).toHaveBeenCalled();
    });
  });
});
