import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockRequest, createMockResponse } from '../../../setup.js';

vi.mock('../../../../repositories/index.js', () => ({
  postRepository: {
    findAll: vi.fn(),
    countAll: vi.fn(),
    countPublished: vi.fn(),
  },
  tipRepository: {
    findAll: vi.fn(),
    countAll: vi.fn(),
    countPublished: vi.fn(),
  },
  videoRepository: {
    findAll: vi.fn(),
    countAll: vi.fn(),
    countPublished: vi.fn(),
  },
  analyticRepository: {
    getTotalCounts: vi.fn(),
  },
}));

import { DashboardController } from '../../../../controllers/admin/DashboardController.js';
import {
  postRepository,
  tipRepository,
  videoRepository,
  analyticRepository,
} from '../../../../repositories/index.js';

describe('DashboardController', () => {
  let controller: DashboardController;
  let req: ReturnType<typeof createMockRequest>;
  let res: ReturnType<typeof createMockResponse>;

  beforeEach(() => {
    vi.clearAllMocks();
    controller = new DashboardController();
    req = createMockRequest();
    res = createMockResponse();
  });

  describe('index', () => {
    it('renders dashboard with stats and tags', async () => {
      vi.mocked(postRepository.countAll).mockResolvedValue(10);
      vi.mocked(postRepository.countPublished).mockResolvedValue(8);
      vi.mocked(tipRepository.countAll).mockResolvedValue(5);
      vi.mocked(tipRepository.countPublished).mockResolvedValue(4);
      vi.mocked(videoRepository.countAll).mockResolvedValue(3);
      vi.mocked(videoRepository.countPublished).mockResolvedValue(2);
      vi.mocked(postRepository.findAll).mockResolvedValue([{ tags: '["js"]' }] as any);
      vi.mocked(tipRepository.findAll).mockResolvedValue([{ tags: '["vim"]' }] as any);
      vi.mocked(videoRepository.findAll).mockResolvedValue([{ tags: '["tutorial"]' }] as any);
      vi.mocked(analyticRepository.getTotalCounts).mockResolvedValue({
        posts: 100,
        tips: 50,
        videos: 25,
        total: 175,
      });

      await controller.index(req as any, res as any);

      expect(res.render).toHaveBeenCalledWith('admin/dashboard', expect.objectContaining({
        title: 'Dashboard',
        stats: {
          posts: { total: 10, published: 8 },
          tips: { total: 5, published: 4 },
          videos: { total: 3, published: 2 },
        },
        analytics: {
          posts: 100,
          tips: 50,
          videos: 25,
          total: 175,
        },
      }));
    });

    it('calculates tag counts correctly', async () => {
      vi.mocked(postRepository.countAll).mockResolvedValue(0);
      vi.mocked(postRepository.countPublished).mockResolvedValue(0);
      vi.mocked(tipRepository.countAll).mockResolvedValue(0);
      vi.mocked(tipRepository.countPublished).mockResolvedValue(0);
      vi.mocked(videoRepository.countAll).mockResolvedValue(0);
      vi.mocked(videoRepository.countPublished).mockResolvedValue(0);
      vi.mocked(postRepository.findAll).mockResolvedValue([
        { tags: '["js", "ts"]' },
        { tags: '["js"]' },
      ] as any);
      vi.mocked(tipRepository.findAll).mockResolvedValue([
        { tags: '["vim"]' },
      ] as any);
      vi.mocked(videoRepository.findAll).mockResolvedValue([
        { tags: '["js"]' },
      ] as any);
      vi.mocked(analyticRepository.getTotalCounts).mockResolvedValue({
        posts: 0,
        tips: 0,
        videos: 0,
        total: 0,
      });

      await controller.index(req as any, res as any);

      const renderCall = (res.render as any).mock.calls[0];
      const tags = renderCall?.[1]?.tags;

      const jsTag = tags.find((t: any) => t.name === 'js');
      expect(jsTag).toEqual({
        name: 'js',
        postCount: 2,
        tipCount: 0,
        videoCount: 1,
      });
    });
  });
});
