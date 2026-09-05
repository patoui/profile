import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import { testPrisma, setupTestDatabase, cleanupTestDatabase } from '../setup.js';
import { PostRepository } from '../../../repositories/PostRepository.js';

describe('PostRepository Integration', () => {
  let repository: PostRepository;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  beforeEach(async () => {
    await cleanupTestDatabase();
    repository = new PostRepository();
  });

  afterAll(async () => {
    await testPrisma.$disconnect();
  });

  describe('create and findAll', () => {
    it('creates a post and retrieves it', async () => {
      const post = await repository.create({
        title: 'Test Post',
        body: 'Test body content',
        tags: ['javascript', 'testing'],
      });

      expect(post.id).toBeDefined();
      expect(post.title).toBe('Test Post');
      expect(post.slug).toBe('test-post');

      const allPosts = await repository.findAll();
      expect(allPosts).toHaveLength(1);
      expect(allPosts[0]?.title).toBe('Test Post');
    });
  });

  describe('findBySlug', () => {
    it('finds post by slug', async () => {
      await repository.create({
        title: 'My Unique Post',
        body: 'Content',
        tags: [],
      });

      const found = await repository.findBySlug('my-unique-post');
      expect(found).not.toBeNull();
      expect(found?.title).toBe('My Unique Post');
    });

    it('returns null for non-existent slug', async () => {
      const found = await repository.findBySlug('non-existent');
      expect(found).toBeNull();
    });
  });

  describe('findById', () => {
    it('finds post by id', async () => {
      const created = await repository.create({
        title: 'Post to Find',
        body: 'Content',
        tags: [],
      });

      const found = await repository.findById(created.id);
      expect(found).not.toBeNull();
      expect(found?.title).toBe('Post to Find');
    });
  });

  describe('update', () => {
    it('updates post fields', async () => {
      const created = await repository.create({
        title: 'Original Title',
        body: 'Original body',
        tags: ['old'],
      });

      const updated = await repository.update(created.id, {
        title: 'Updated Title',
        body: 'Updated body',
        tags: ['new', 'tags'],
      });

      expect(updated.title).toBe('Updated Title');
      expect(updated.body).toBe('Updated body');
      expect(JSON.parse(updated.tags)).toEqual(['new', 'tags']);
    });
  });

  describe('togglePublish', () => {
    it('publishes an unpublished post', async () => {
      const created = await repository.create({
        title: 'Draft Post',
        body: 'Content',
        tags: [],
      });

      expect(created.publishedAt).toBeNull();

      const toggled = await repository.togglePublish(created.id);
      expect(toggled.publishedAt).not.toBeNull();
    });

    it('unpublishes a published post', async () => {
      const created = await repository.create({
        title: 'Published Post',
        body: 'Content',
        tags: [],
      });

      // First publish
      await repository.togglePublish(created.id);
      // Then unpublish
      const toggled = await repository.togglePublish(created.id);
      expect(toggled.publishedAt).toBeNull();
    });
  });

  describe('delete', () => {
    it('deletes a post', async () => {
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
    it('returns only published posts', async () => {
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

      const publishedPosts = await repository.findPublished();
      expect(publishedPosts).toHaveLength(1);
      expect(publishedPosts[0]?.title).toBe('Published');
    });

    it('filters by tag', async () => {
      const post1 = await repository.create({
        title: 'Post 1',
        body: 'Content',
        tags: ['javascript'],
      });
      await repository.togglePublish(post1.id);

      const post2 = await repository.create({
        title: 'Post 2',
        body: 'Content',
        tags: ['python'],
      });
      await repository.togglePublish(post2.id);

      const jsPosts = await repository.findPublished('javascript');
      expect(jsPosts).toHaveLength(1);
      expect(jsPosts[0]?.title).toBe('Post 1');
    });
  });

  describe('getPreviousPublished and getNextPublished', () => {
    it('returns previous and next published posts', async () => {
      vi.useFakeTimers();

      const post1 = await repository.create({ title: 'First', body: 'Content', tags: [] });
      await repository.togglePublish(post1.id);

      vi.advanceTimersByTime(1000);

      const post2 = await repository.create({ title: 'Second', body: 'Content', tags: [] });
      await repository.togglePublish(post2.id);

      vi.advanceTimersByTime(1000);

      const post3 = await repository.create({ title: 'Third', body: 'Content', tags: [] });
      await repository.togglePublish(post3.id);

      vi.useRealTimers();

      // Refetch post2 to get updated publishedAt
      const middlePost = await repository.findById(post2.id);

      const previous = await repository.getPreviousPublished(middlePost!);
      const next = await repository.getNextPublished(middlePost!);

      expect(previous?.title).toBe('First');
      expect(next?.title).toBe('Third');
    });
  });

  describe('countAll and countPublished', () => {
    it('returns correct counts', async () => {
      await repository.create({ title: 'Draft 1', body: 'Content', tags: [] });
      await repository.create({ title: 'Draft 2', body: 'Content', tags: [] });

      const pub = await repository.create({ title: 'Published', body: 'Content', tags: [] });
      await repository.togglePublish(pub.id);

      const total = await repository.countAll();
      const published = await repository.countPublished();

      expect(total).toBe(3);
      expect(published).toBe(1);
    });
  });
});
