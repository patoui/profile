import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../lib/prisma.js', () => ({
  prisma: {
    analytic: {
      create: vi.fn(),
      count: vi.fn(),
    },
  },
}));

import { AnalyticRepository } from '../../../repositories/AnalyticRepository.js';
import { prisma } from '../../../lib/prisma.js';

describe('AnalyticRepository', () => {
  let repository: AnalyticRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new AnalyticRepository();
  });

  describe('record', () => {
    it('records analytics for a post', async () => {
      const mockAnalytic = { id: 1, analyticalId: 1, analyticalType: 'App\\Post' };
      vi.mocked(prisma.analytic.create).mockResolvedValue(mockAnalytic as any);

      const mockReq = {
        get: vi.fn((header: string) => {
          if (header === 'user-agent') return 'Mozilla/5.0';
          if (header === 'referer') return 'https://google.com';
          return '';
        }),
        ip: '192.168.1.1',
        socket: { remoteAddress: '192.168.1.1' },
      };

      repository.record('post', 1, mockReq as any);

      expect(prisma.analytic.create).toHaveBeenCalledWith({
        data: {
          analyticalId: 1,
          analyticalType: 'App\\Post',
          headers: expect.any(String),
        },
      });
    });

    it('records analytics for a tip', async () => {
      const mockAnalytic = { id: 1, analyticalId: 2, analyticalType: 'App\\Tip' };
      vi.mocked(prisma.analytic.create).mockResolvedValue(mockAnalytic as any);

      const mockReq = {
        get: vi.fn(() => ''),
        ip: '127.0.0.1',
        socket: { remoteAddress: '127.0.0.1' },
      };

      await repository.record('tip', 2, mockReq as any);

      expect(prisma.analytic.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          analyticalType: 'App\\Tip',
        }),
      });
    });

    it('records analytics for a video', async () => {
      const mockAnalytic = { id: 1, analyticalId: 3, analyticalType: 'App\\Video' };
      vi.mocked(prisma.analytic.create).mockResolvedValue(mockAnalytic as any);

      const mockReq = {
        get: vi.fn(() => ''),
        ip: undefined,
        socket: { remoteAddress: '10.0.0.1' },
      };

      await repository.record('video', 3, mockReq as any);

      expect(prisma.analytic.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          analyticalType: 'App\\Video',
        }),
      });
    });

    it('stores headers as JSON string', async () => {
      vi.mocked(prisma.analytic.create).mockResolvedValue({ id: 1 } as any);

      const mockReq = {
        get: vi.fn((header: string) => {
          if (header === 'user-agent') return 'Chrome';
          if (header === 'referer') return 'https://test.com';
          return '';
        }),
        ip: '1.2.3.4',
        socket: { remoteAddress: '1.2.3.4' },
      };

      await repository.record('post', 1, mockReq as any);

      const callArgs = vi.mocked(prisma.analytic.create).mock.calls[0]?.[0];
      const headers = JSON.parse(callArgs?.data.headers as string);
      expect(headers).toEqual({
        userAgent: 'Chrome',
        ip: '1.2.3.4',
        referer: 'https://test.com',
      });
    });
  });

  describe('countByPost', () => {
    it('returns count for a specific post', async () => {
      vi.mocked(prisma.analytic.count).mockResolvedValue(42);

      const result = await repository.countByPost(1);

      expect(result).toBe(42);
      expect(prisma.analytic.count).toHaveBeenCalledWith({
        where: {
          analyticalId: 1,
          analyticalType: 'App\\Post',
        },
      });
    });
  });

  describe('countByTip', () => {
    it('returns count for a specific tip', async () => {
      vi.mocked(prisma.analytic.count).mockResolvedValue(15);

      const result = await repository.countByTip(2);

      expect(result).toBe(15);
      expect(prisma.analytic.count).toHaveBeenCalledWith({
        where: {
          analyticalId: 2,
          analyticalType: 'App\\Tip',
        },
      });
    });
  });

  describe('countByVideo', () => {
    it('returns count for a specific video', async () => {
      vi.mocked(prisma.analytic.count).mockResolvedValue(100);

      const result = await repository.countByVideo(3);

      expect(result).toBe(100);
      expect(prisma.analytic.count).toHaveBeenCalledWith({
        where: {
          analyticalId: 3,
          analyticalType: 'App\\Video',
        },
      });
    });
  });

  describe('getTotalCounts', () => {
    it('returns total counts for all types', async () => {
      vi.mocked(prisma.analytic.count)
        .mockResolvedValueOnce(50)  // posts
        .mockResolvedValueOnce(30)  // tips
        .mockResolvedValueOnce(20); // videos

      const result = await repository.getTotalCounts();

      expect(result).toEqual({
        posts: 50,
        tips: 30,
        videos: 20,
        total: 100,
      });
    });
  });
});
