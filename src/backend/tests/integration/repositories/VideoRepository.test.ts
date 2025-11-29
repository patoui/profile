import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import { testPrisma, setupTestDatabase, cleanupTestDatabase } from '../setup.js';

vi.mock('../../../lib/prisma.js', () => ({
  prisma: testPrisma,
}));

import { VideoRepository } from '../../../repositories/VideoRepository.js';

describe('VideoRepository Integration', () => {
  let repository: VideoRepository;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  beforeEach(async () => {
    await cleanupTestDatabase();
    repository = new VideoRepository();
  });

  afterAll(async () => {
    await testPrisma.$disconnect();
  });

  describe('create and findAll', () => {
    it('creates a video and retrieves it', async () => {
      const video = await repository.create({
        title: 'Tutorial Video',
        description: 'Learn something new',
        externalId: 'dQw4w9WgXcQ',
        tags: ['tutorial'],
      });

      expect(video.id).toBeDefined();
      expect(video.title).toBe('Tutorial Video');
      expect(video.slug).toBe('tutorial-video');
      expect(video.externalId).toBe('dQw4w9WgXcQ');

      const allVideos = await repository.findAll();
      expect(allVideos).toHaveLength(1);
    });
  });

  describe('findBySlug', () => {
    it('finds video by slug', async () => {
      await repository.create({
        title: 'My Tutorial',
        description: 'Description',
        externalId: 'abc123',
        tags: [],
      });

      const found = await repository.findBySlug('my-tutorial');
      expect(found).not.toBeNull();
      expect(found?.title).toBe('My Tutorial');
    });
  });

  describe('update', () => {
    it('updates video fields', async () => {
      const created = await repository.create({
        title: 'Original',
        description: 'Original desc',
        externalId: 'abc',
        tags: [],
      });

      const updated = await repository.update(created.id, {
        title: 'Updated',
        description: 'Updated desc',
        externalId: 'xyz',
        tags: ['new'],
      });

      expect(updated.title).toBe('Updated');
      expect(updated.description).toBe('Updated desc');
      expect(updated.externalId).toBe('xyz');
    });
  });

  describe('togglePublish', () => {
    it('toggles publish status', async () => {
      const created = await repository.create({
        title: 'Draft Video',
        description: 'Desc',
        externalId: 'abc',
        tags: [],
      });

      expect(created.publishedAt).toBeNull();

      const toggled = await repository.togglePublish(created.id);
      expect(toggled.publishedAt).not.toBeNull();
    });
  });

  describe('delete', () => {
    it('deletes a video', async () => {
      const created = await repository.create({
        title: 'To Delete',
        description: 'Desc',
        externalId: 'abc',
        tags: [],
      });

      await repository.delete(created.id);

      const found = await repository.findById(created.id);
      expect(found).toBeNull();
    });
  });

  describe('findPublished', () => {
    it('returns only published videos', async () => {
      await repository.create({
        title: 'Draft',
        description: 'Desc',
        externalId: 'abc',
        tags: [],
      });

      const published = await repository.create({
        title: 'Published',
        description: 'Desc',
        externalId: 'xyz',
        tags: [],
      });
      await repository.togglePublish(published.id);

      const publishedVideos = await repository.findPublished();
      expect(publishedVideos).toHaveLength(1);
      expect(publishedVideos[0]?.title).toBe('Published');
    });

    it('filters by tag', async () => {
      const video1 = await repository.create({
        title: 'Video 1',
        description: 'Desc',
        externalId: 'abc',
        tags: ['tutorial'],
      });
      await repository.togglePublish(video1.id);

      const video2 = await repository.create({
        title: 'Video 2',
        description: 'Desc',
        externalId: 'xyz',
        tags: ['review'],
      });
      await repository.togglePublish(video2.id);

      const tutorials = await repository.findPublished('tutorial');
      expect(tutorials).toHaveLength(1);
      expect(tutorials[0]?.title).toBe('Video 1');
    });
  });

  describe('countAll and countPublished', () => {
    it('returns correct counts', async () => {
      await repository.create({ title: 'Draft', description: 'D', externalId: 'a', tags: [] });

      const pub = await repository.create({ title: 'Published', description: 'D', externalId: 'b', tags: [] });
      await repository.togglePublish(pub.id);

      expect(await repository.countAll()).toBe(2);
      expect(await repository.countPublished()).toBe(1);
    });
  });
});
