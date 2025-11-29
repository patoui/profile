import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../lib/prisma.js', () => ({
  prisma: {
    tip: {
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

import { prisma } from '../../../lib/prisma.js';
import { TipRepository } from '../../../repositories/TipRepository.js';

describe('TipRepository', () => {
  let repository: TipRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new TipRepository();
  });

  describe('findAll', () => {
    it('returns all tips ordered by createdAt desc', async () => {
      const mockTips = [
        { id: 1, title: 'Tip 1', createdAt: new Date() },
        { id: 2, title: 'Tip 2', createdAt: new Date() },
      ];
      vi.mocked(prisma.tip.findMany).mockResolvedValue(mockTips as any);

      const result = await repository.findAll();

      expect(result).toEqual(mockTips);
      expect(prisma.tip.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findPublished', () => {
    it('returns published tips', async () => {
      const mockTips = [
        { id: 1, title: 'Tip 1', publishedAt: new Date(), tags: '[]' },
      ];
      vi.mocked(prisma.tip.findMany).mockResolvedValue(mockTips as any);

      const result = await repository.findPublished();

      expect(result).toEqual(mockTips);
    });

    it('filters by tag when provided', async () => {
      const mockTips = [
        { id: 1, title: 'Tip 1', publishedAt: new Date(), tags: '["vim"]' },
        { id: 2, title: 'Tip 2', publishedAt: new Date(), tags: '["bash"]' },
      ];
      vi.mocked(prisma.tip.findMany).mockResolvedValue(mockTips as any);

      const result = await repository.findPublished('vim');

      expect(result).toHaveLength(1);
      expect(result[0]?.title).toBe('Tip 1');
    });
  });

  describe('findBySlug', () => {
    it('returns tip by slug', async () => {
      const mockTip = { id: 1, slug: 'test-tip', title: 'Test Tip' };
      vi.mocked(prisma.tip.findUnique).mockResolvedValue(mockTip as any);

      const result = await repository.findBySlug('test-tip');

      expect(result).toEqual(mockTip);
    });
  });

  describe('findById', () => {
    it('returns tip by id', async () => {
      const mockTip = { id: 1, title: 'Test Tip' };
      vi.mocked(prisma.tip.findUnique).mockResolvedValue(mockTip as any);

      const result = await repository.findById(1);

      expect(result).toEqual(mockTip);
    });
  });

  describe('create', () => {
    it('creates a tip with generated slug', async () => {
      const mockTip = { id: 1, title: 'Test Tip', slug: 'test-tip', body: 'Body', tags: '[]' };
      vi.mocked(prisma.tip.create).mockResolvedValue(mockTip as any);

      const result = await repository.create({
        title: 'Test Tip',
        body: 'Body',
        tags: [],
      });

      expect(result).toEqual(mockTip);
      expect(prisma.tip.create).toHaveBeenCalledWith({
        data: {
          title: 'Test Tip',
          slug: 'test-tip',
          body: 'Body',
          tags: '[]',
        },
      });
    });
  });

  describe('update', () => {
    it('updates a tip', async () => {
      const mockTip = { id: 1, title: 'Updated', body: 'New body', tags: '[]' };
      vi.mocked(prisma.tip.update).mockResolvedValue(mockTip as any);

      const result = await repository.update(1, {
        title: 'Updated',
        body: 'New body',
      });

      expect(result).toEqual(mockTip);
    });
  });

  describe('togglePublish', () => {
    it('publishes an unpublished tip', async () => {
      const mockTip = { id: 1, publishedAt: null };
      vi.mocked(prisma.tip.findUnique).mockResolvedValue(mockTip as any);
      vi.mocked(prisma.tip.update).mockResolvedValue({ ...mockTip, publishedAt: new Date() } as any);

      await repository.togglePublish(1);

      expect(prisma.tip.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { publishedAt: expect.any(Date) },
      });
    });

    it('throws when tip not found', async () => {
      vi.mocked(prisma.tip.findUnique).mockResolvedValue(null);

      await expect(repository.togglePublish(999)).rejects.toThrow('Tip not found');
    });
  });

  describe('delete', () => {
    it('deletes a tip', async () => {
      vi.mocked(prisma.tip.delete).mockResolvedValue({ id: 1 } as any);

      await repository.delete(1);

      expect(prisma.tip.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });

  describe('getPreviousPublished', () => {
    it('returns previous published tip', async () => {
      const currentTip = { id: 2, publishedAt: new Date('2024-01-15') };
      const previousTip = { id: 1, publishedAt: new Date('2024-01-10') };
      vi.mocked(prisma.tip.findFirst).mockResolvedValue(previousTip as any);

      const result = await repository.getPreviousPublished(currentTip as any);

      expect(result).toEqual(previousTip);
    });

    it('returns null for unpublished tip', async () => {
      const currentTip = { id: 1, publishedAt: null };

      const result = await repository.getPreviousPublished(currentTip as any);

      expect(result).toBeNull();
    });
  });

  describe('getNextPublished', () => {
    it('returns next published tip', async () => {
      const currentTip = { id: 1, publishedAt: new Date('2024-01-10') };
      const nextTip = { id: 2, publishedAt: new Date('2024-01-15') };
      vi.mocked(prisma.tip.findFirst).mockResolvedValue(nextTip as any);

      const result = await repository.getNextPublished(currentTip as any);

      expect(result).toEqual(nextTip);
    });
  });

  describe('countAll', () => {
    it('returns total count', async () => {
      vi.mocked(prisma.tip.count).mockResolvedValue(10);

      const result = await repository.countAll();

      expect(result).toBe(10);
    });
  });

  describe('countPublished', () => {
    it('returns published count', async () => {
      vi.mocked(prisma.tip.count).mockResolvedValue(5);

      const result = await repository.countPublished();

      expect(result).toBe(5);
    });
  });
});
