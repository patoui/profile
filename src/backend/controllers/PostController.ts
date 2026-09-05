import { Request, Response } from 'express';
import { postRepository, analyticRepository } from '../repositories/index.js';
import { parseMarkdown, getShortBody } from '../utils/helpers.js';
import type { Post } from '../types/prisma.js';

function parseTags(tagsJson: string): string[] {
  try {
    return JSON.parse(tagsJson) as string[];
  } catch {
    return [];
  }
}

function getUniqueTags(items: { tags: string }[]): string[] {
  const allTags = items.flatMap((item) => parseTags(item.tags));
  return [...new Set(allTags)].sort();
}

export class PostController {
  async index(req: Request, res: Response): Promise<void> {
    const tag = req.query['tag'] as string | undefined;
    const posts = await postRepository.findPublished(tag);
    const allPosts = await postRepository.findPublished();
    const tags = getUniqueTags(allPosts);

    const postsWithShortBody = posts.map((post: Post) => ({
      ...post,
      shortBody: getShortBody(post.body),
      tagNames: parseTags(post.tags),
    }));

    res.render('posts/index', {
      title: 'Articles',
      posts: postsWithShortBody,
      tags,
      selectedTag: tag || null,
      currentPath: '/blog',
    });
  }

  async show(req: Request, res: Response): Promise<void> {
    if (!req.params['slug']) {
      res.status(404).render('errors/404', { message: 'Post not found' });
      return;
    }

    const post = await postRepository.findBySlug(req.params['slug']);

    if (!post || !post.publishedAt) {
      res.status(404).render('errors/404', { message: 'Post not found' });
      return;
    }

    analyticRepository.record('post', post.id, req).catch(console.error);

    const [nextPost, previousPost] = await Promise.all([
      postRepository.getNextPublished(post),
      postRepository.getPreviousPublished(post),
    ]);

    res.render('posts/show', {
      title: post.title,
      post: {
        ...post,
        bodyHtml: parseMarkdown(post.body),
        shortBody: getShortBody(post.body),
        tagNames: parseTags(post.tags),
      },
      previousPost,
      nextPost,
      currentPath: '/blog',
    });
  }
}

export const postController = new PostController();
