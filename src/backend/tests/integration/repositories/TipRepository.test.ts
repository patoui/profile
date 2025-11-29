import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import { testPrisma, setupTestDatabase, cleanupTestDatabase } from '../setup.js';

vi.mock('../../../lib/prisma.js', () => ({
  prisma: testPrisma,
}));

import { TipRepository } from '../../../repositories/TipRepository.js';

describe('TipRepository Integration', () => {
  let repository: TipRepository;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  beforeEach(async () => {
    await cleanupTestDatabase();
    repository = new TipRepository();
  });

  afterAll(async () => {
    await testPrisma.$disconnect();
  });

  describe('create and findAll', () => {
    it('creates a tip and retrieves it', async () => {
      const tip = await repository.create({
        title: 'Vim Tip',
        body: 'Use :wq to save and quit',
        tags: ['vim', 'productivity'],
      });

      expect(tip.id).toBeDefined();
      expect(tip.title).toBe('Vim Tip');
      expect(tip.slug).toBe('vim-tip');

      const allTips = await repository.findAll();
      expect(allTips).toHaveLength(1);
    });
  });

  describe('findBySlug', () => {
    it('finds tip by slug', async () => {
      await repository.create({
        title: 'My Vim Tip',
        body: 'Content',
        tags: [],
      });

      const found = await repository.findBySlug('my-vim-tip');
      expect(found).not.toBeNull();
      expect(found?.title).toBe('My Vim Tip');
    });
  });

  describe('update', () => {
    it('updates tip fields', async () => {
      const created = await repository.create({
        title: 'Original',
        body: 'Original body',
        tags: [],
      });

      const updated = await repository.update(created.id, {
        title: 'Updated',
        body: 'Updated body',
        tags: ['new'],
      });

      expect(updated.title).toBe('Updated');
      expect(updated.body).toBe('Updated body');
    });
  });

  describe('togglePublish', () => {
    it('toggles publish status', async () => {
      const created = await repository.create({
        title: 'Draft Tip',
        body: 'Content',
        tags: [],
      });

      expect(created.publishedAt).toBeNull();

      const toggled = await repository.togglePublish(created.id);
      expect(toggled.publishedAt).not.toBeNull();
    });
  });

  describe('delete', () => {
    it('deletes a tip', async () => {
      const created = await repository.create({
        title: 'To Delete',
        body: 'Content',
        tags: [],
      });

      await repository.delete(created.id);

      const found = await repository.findById(created.id);
      expect(found).toBeNull();
    });
  });

  describe('findPublished', () => {
    it('returns only published tips', async () => {
      await repository.create({
        title: 'Draft',
        body: 'Content',
        tags: [],
      });

      const published = await repository.create({
        title: 'Published',
        body: 'Content',
        tags: [],
      });
      await repository.togglePublish(published.id);

      const publishedTips = await repository.findPublished();
      expect(publishedTips).toHaveLength(1);
      expect(publishedTips[0]?.title).toBe('Published');
    });
  });

  describe('countAll and countPublished', () => {
    it('returns correct counts', async () => {
      await repository.create({ title: 'Draft', body: 'Content', tags: [] });

      const pub = await repository.create({ title: 'Published', body: 'Content', tags: [] });
      await repository.togglePublish(pub.id);

      expect(await repository.countAll()).toBe(2);
      expect(await repository.countPublished()).toBe(1);
    });
  });
});
