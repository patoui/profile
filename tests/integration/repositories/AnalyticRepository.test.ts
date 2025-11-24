import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import { testPrisma, setupTestDatabase, cleanupTestDatabase } from '../setup.js';

vi.mock('../../../lib/prisma.js', () => ({
  prisma: testPrisma,
}));

import { AnalyticRepository } from '../../../src/repositories/AnalyticRepository.js';

describe('AnalyticRepository Integration', () => {
  let repository: AnalyticRepository;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  beforeEach(async () => {
    await cleanupTestDatabase();
    repository = new AnalyticRepository();
  });

  afterAll(async () => {
    await testPrisma.$disconnect();
  });

  const createMockRequest = () => ({
    get: vi.fn((header: string) => {
      if (header === 'user-agent') return 'Mozilla/5.0 Test Browser';
      if (header === 'referer') return 'https://google.com';
      return '';
    }),
    ip: '192.168.1.100',
    socket: { remoteAddress: '192.168.1.100' },
  });

  describe('record', () => {
    it('records analytics for a post view', async () => {
      const req = createMockRequest();

      const analytic = await repository.record('post', 1, req as any);

      expect(analytic.id).toBeDefined();
      expect(analytic.analyticalId).toBe(1);
      expect(analytic.analyticalType).toBe('App\\Post');

      const headers = JSON.parse(analytic.headers);
      expect(headers.userAgent).toBe('Mozilla/5.0 Test Browser');
      expect(headers.ip).toBe('192.168.1.100');
      expect(headers.referer).toBe('https://google.com');
    });

    it('records analytics for a tip view', async () => {
      const req = createMockRequest();

      const analytic = await repository.record('tip', 2, req as any);

      expect(analytic.analyticalType).toBe('App\\Tip');
      expect(analytic.analyticalId).toBe(2);
    });

    it('records analytics for a video view', async () => {
      const req = createMockRequest();

      const analytic = await repository.record('video', 3, req as any);

      expect(analytic.analyticalType).toBe('App\\Video');
      expect(analytic.analyticalId).toBe(3);
    });
  });

  describe('countByPost', () => {
    it('counts views for a specific post', async () => {
      const req = createMockRequest();

      await repository.record('post', 1, req as any);
      await repository.record('post', 1, req as any);
      await repository.record('post', 2, req as any); // Different post

      const count = await repository.countByPost(1);
      expect(count).toBe(2);
    });
  });

  describe('countByTip', () => {
    it('counts views for a specific tip', async () => {
      const req = createMockRequest();

      await repository.record('tip', 5, req as any);
      await repository.record('tip', 5, req as any);
      await repository.record('tip', 5, req as any);

      const count = await repository.countByTip(5);
      expect(count).toBe(3);
    });
  });

  describe('countByVideo', () => {
    it('counts views for a specific video', async () => {
      const req = createMockRequest();

      await repository.record('video', 10, req as any);

      const count = await repository.countByVideo(10);
      expect(count).toBe(1);
    });
  });

  describe('getTotalCounts', () => {
    it('returns total counts for all content types', async () => {
      const req = createMockRequest();

      // Record some analytics
      await repository.record('post', 1, req as any);
      await repository.record('post', 2, req as any);
      await repository.record('post', 1, req as any);
      await repository.record('tip', 1, req as any);
      await repository.record('video', 1, req as any);
      await repository.record('video', 2, req as any);

      const counts = await repository.getTotalCounts();

      expect(counts.posts).toBe(3);
      expect(counts.tips).toBe(1);
      expect(counts.videos).toBe(2);
      expect(counts.total).toBe(6);
    });

    it('returns zeros when no analytics exist', async () => {
      const counts = await repository.getTotalCounts();

      expect(counts).toEqual({
        posts: 0,
        tips: 0,
        videos: 0,
        total: 0,
      });
    });
  });
});
