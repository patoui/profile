import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockRequest, createMockResponse } from '../../setup.js';

vi.mock('../../../src/repositories/index.js', () => ({
  videoRepository: {
    findPublished: vi.fn(),
    findBySlug: vi.fn(),
    getPreviousPublished: vi.fn(),
    getNextPublished: vi.fn(),
  },
  analyticRepository: {
    record: vi.fn(),
  },
}));

import { VideoController } from '../../../src/controllers/VideoController.js';
import { videoRepository, analyticRepository } from '../../../src/repositories/index.js';

describe('VideoController', () => {
  let controller: VideoController;
  let req: ReturnType<typeof createMockRequest>;
  let res: ReturnType<typeof createMockResponse>;

  beforeEach(() => {
    vi.clearAllMocks();
    controller = new VideoController();
    req = createMockRequest();
    res = createMockResponse();
  });

  describe('index', () => {
    it('renders videos index with videos and tags', async () => {
      const mockVideos = [
        {
          id: 1,
          title: 'Video 1',
          externalId: 'abc123',
          tags: '["tutorial"]',
          publishedAt: new Date(),
        },
      ];
      vi.mocked(videoRepository.findPublished).mockResolvedValue(mockVideos as any);

      await controller.index(req as any, res as any);

      expect(res.render).toHaveBeenCalledWith('videos/index', expect.objectContaining({
        title: 'Videos',
        currentPath: '/video',
        selectedTag: null,
      }));
    });

    it('filters by tag when provided', async () => {
      req.query = { tag: 'tutorial' };
      vi.mocked(videoRepository.findPublished).mockResolvedValue([]);

      await controller.index(req as any, res as any);

      expect(videoRepository.findPublished).toHaveBeenCalledWith('tutorial');
    });

    it('includes thumbnailUrl for each video', async () => {
      const mockVideos = [
        {
          id: 1,
          title: 'Video 1',
          externalId: 'dQw4w9WgXcQ',
          tags: '[]',
          publishedAt: new Date(),
        },
      ];
      vi.mocked(videoRepository.findPublished).mockResolvedValue(mockVideos as any);

      await controller.index(req as any, res as any);

      const renderCall = (res.render as any).mock.calls[0];
      const videos = renderCall?.[1]?.videos;
      expect(videos[0]).toHaveProperty('thumbnailUrl');
      expect(videos[0].thumbnailUrl).toContain('dQw4w9WgXcQ');
    });
  });

  describe('show', () => {
    it('renders video show page', async () => {
      const mockVideo = {
        id: 1,
        title: 'Test Video',
        slug: 'test-video',
        description: 'Description',
        externalId: 'abc123',
        tags: '["test"]',
        publishedAt: new Date(),
      };
      req.params = { slug: 'test-video' };
      vi.mocked(videoRepository.findBySlug).mockResolvedValue(mockVideo as any);
      vi.mocked(videoRepository.getPreviousPublished).mockResolvedValue(null);
      vi.mocked(videoRepository.getNextPublished).mockResolvedValue(null);

      await controller.show(req as any, res as any);

      expect(res.render).toHaveBeenCalledWith('videos/show', expect.objectContaining({
        title: 'Test Video',
        currentPath: '/video',
      }));
    });

    it('records analytics when viewing video', async () => {
      const mockVideo = {
        id: 1,
        title: 'Test Video',
        slug: 'test-video',
        description: 'Desc',
        externalId: 'abc',
        tags: '[]',
        publishedAt: new Date(),
      };
      req.params = { slug: 'test-video' };
      vi.mocked(videoRepository.findBySlug).mockResolvedValue(mockVideo as any);
      vi.mocked(videoRepository.getPreviousPublished).mockResolvedValue(null);
      vi.mocked(videoRepository.getNextPublished).mockResolvedValue(null);

      await controller.show(req as any, res as any);

      expect(analyticRepository.record).toHaveBeenCalledWith('video', 1, req);
    });

    it('includes embedUrl in video data', async () => {
      const mockVideo = {
        id: 1,
        title: 'Test Video',
        slug: 'test-video',
        description: 'Desc',
        externalId: 'xyz789',
        tags: '[]',
        publishedAt: new Date(),
      };
      req.params = { slug: 'test-video' };
      vi.mocked(videoRepository.findBySlug).mockResolvedValue(mockVideo as any);
      vi.mocked(videoRepository.getPreviousPublished).mockResolvedValue(null);
      vi.mocked(videoRepository.getNextPublished).mockResolvedValue(null);

      await controller.show(req as any, res as any);

      const renderCall = (res.render as any).mock.calls[0];
      const video = renderCall?.[1]?.video;
      expect(video.embedUrl).toContain('xyz789');
    });

    it('renders 404 when video not found', async () => {
      req.params = { slug: 'nonexistent' };
      vi.mocked(videoRepository.findBySlug).mockResolvedValue(null);

      await controller.show(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.render).toHaveBeenCalledWith('errors/404', { message: 'Video not found' });
    });

    it('renders 404 when video is not published', async () => {
      const mockVideo = {
        id: 1,
        title: 'Draft Video',
        slug: 'draft-video',
        publishedAt: null,
      };
      req.params = { slug: 'draft-video' };
      vi.mocked(videoRepository.findBySlug).mockResolvedValue(mockVideo as any);

      await controller.show(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
