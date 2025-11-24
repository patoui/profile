import { Post } from '../../generated/prisma/client.js';
import { prisma } from '../../lib/prisma.js';
import { generateSlug } from '../utils/helpers.js';
import { PostInput } from '../types/index.js';

export class PostRepository {
  async findAll(): Promise<Post[]> {
    return prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findPublished(tagName?: string): Promise<Post[]> {
    const posts = await prisma.post.findMany({
      where: {
        publishedAt: { not: null, lte: new Date() },
      },
      orderBy: { publishedAt: 'desc' },
    });

    if (tagName) {
      return posts.filter((post: Post) => {
        const tags = JSON.parse(post.tags) as string[];
        return tags.includes(tagName);
      });
    }

    return posts;
  }

  async findBySlug(slug: string): Promise<Post | null> {
    return prisma.post.findUnique({
      where: { slug },
    });
  }

  async findById(id: number): Promise<Post | null> {
    return prisma.post.findUnique({
      where: { id },
    });
  }

  async create(input: PostInput): Promise<Post> {
    const slug = generateSlug(input.title);

    return prisma.post.create({
      data: {
        title: input.title,
        slug,
        body: input.body,
        tags: JSON.stringify(input.tags || []),
      },
    });
  }

  async update(id: number, input: PostInput): Promise<Post> {
    const data: { title: string; body: string; tags?: string } = {
      title: input.title,
      body: input.body,
    };

    if (input.tags !== undefined) {
      data.tags = JSON.stringify(input.tags);
    }

    return prisma.post.update({
      where: { id },
      data,
    });
  }

  async togglePublish(id: number): Promise<Post> {
    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) throw new Error('Post not found');

    return prisma.post.update({
      where: { id },
      data: {
        publishedAt: post.publishedAt ? null : new Date(),
      },
    });
  }

  async delete(id: number): Promise<void> {
    await prisma.post.delete({ where: { id } });
  }

  async getPreviousPublished(currentPost: Post): Promise<Post | null> {
    if (!currentPost.publishedAt) return null;

    return prisma.post.findFirst({
      where: {
        publishedAt: { not: null, lt: currentPost.publishedAt },
      },
      orderBy: { publishedAt: 'desc' },
    });
  }

  async getNextPublished(currentPost: Post): Promise<Post | null> {
    if (!currentPost.publishedAt) return null;

    return prisma.post.findFirst({
      where: {
        publishedAt: { not: null, gt: currentPost.publishedAt },
      },
      orderBy: { publishedAt: 'asc' },
    });
  }

  async countAll(): Promise<number> {
    return prisma.post.count();
  }

  async countPublished(): Promise<number> {
    return prisma.post.count({
      where: { publishedAt: { not: null, lte: new Date() } },
    });
  }
}

export const postRepository = new PostRepository();
