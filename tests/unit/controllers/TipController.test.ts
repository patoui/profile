import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockRequest, createMockResponse } from '../../setup.js';

vi.mock('../../../src/repositories/index.js', () => ({
  tipRepository: {
    findPublished: vi.fn(),
    findBySlug: vi.fn(),
    getPreviousPublished: vi.fn(),
    getNextPublished: vi.fn(),
  },
  analyticRepository: {
    record: vi.fn().mockResolvedValue({}),
  },
}));

import { TipController } from '../../../src/controllers/TipController.js';
import { tipRepository, analyticRepository } from '../../../src/repositories/index.js';

describe('TipController', () => {
  let controller: TipController;
  let req: ReturnType<typeof createMockRequest>;
  let res: ReturnType<typeof createMockResponse>;

  beforeEach(() => {
    vi.clearAllMocks();
    controller = new TipController();
    req = createMockRequest();
    res = createMockResponse();
  });

  describe('index', () => {
    it('renders tips index with tips and tags', async () => {
      const mockTips = [
        { id: 1, title: 'Tip 1', body: 'Body 1', tags: '["vim"]', publishedAt: new Date() },
      ];
      vi.mocked(tipRepository.findPublished).mockResolvedValue(mockTips as any);

      await controller.index(req as any, res as any);

      expect(res.render).toHaveBeenCalledWith('tips/index', expect.objectContaining({
        title: 'Tips & Tricks',
        currentPath: '/tip',
        selectedTag: null,
      }));
    });

    it('filters by tag when provided', async () => {
      req.query = { tag: 'vim' };
      vi.mocked(tipRepository.findPublished).mockResolvedValue([]);

      await controller.index(req as any, res as any);

      expect(tipRepository.findPublished).toHaveBeenCalledWith('vim');
    });
  });

  describe('show', () => {
    it('renders tip show page', async () => {
      const mockTip = {
        id: 1,
        title: 'Test Tip',
        slug: 'test-tip',
        body: '# Hello',
        tags: '["test"]',
        publishedAt: new Date(),
      };
      req.params = { slug: 'test-tip' };
      vi.mocked(tipRepository.findBySlug).mockResolvedValue(mockTip as any);
      vi.mocked(tipRepository.getPreviousPublished).mockResolvedValue(null);
      vi.mocked(tipRepository.getNextPublished).mockResolvedValue(null);

      await controller.show(req as any, res as any);

      expect(res.render).toHaveBeenCalledWith('tips/show', expect.objectContaining({
        title: 'Test Tip',
        currentPath: '/tip',
      }));
    });

    it('records analytics when viewing tip', async () => {
      const mockTip = {
        id: 1,
        title: 'Test Tip',
        slug: 'test-tip',
        body: 'Body',
        tags: '[]',
        publishedAt: new Date(),
      };
      req.params = { slug: 'test-tip' };
      vi.mocked(tipRepository.findBySlug).mockResolvedValue(mockTip as any);
      vi.mocked(tipRepository.getPreviousPublished).mockResolvedValue(null);
      vi.mocked(tipRepository.getNextPublished).mockResolvedValue(null);

      await controller.show(req as any, res as any);

      expect(analyticRepository.record).toHaveBeenCalledWith('tip', 1, req);
    });

    it('renders 404 when tip not found', async () => {
      req.params = { slug: 'nonexistent' };
      vi.mocked(tipRepository.findBySlug).mockResolvedValue(null);

      await controller.show(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.render).toHaveBeenCalledWith('errors/404', { message: 'Tip not found' });
    });

    it('renders 404 when tip is not published', async () => {
      const mockTip = {
        id: 1,
        title: 'Draft Tip',
        slug: 'draft-tip',
        publishedAt: null,
      };
      req.params = { slug: 'draft-tip' };
      vi.mocked(tipRepository.findBySlug).mockResolvedValue(mockTip as any);

      await controller.show(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
