import { Request, Response } from 'express';
import { postRepository } from '../../repositories/index.js';
import { Post } from '../../../generated/prisma/client.js';
import { prisma } from '../../../lib/prisma.js';

function parseTags(tagsJson: string): string[] {
  try {
    return JSON.parse(tagsJson) as string[];
  } catch {
    return [];
  }
}

async function getAllUniqueTags(): Promise<{ name: string }[]> {
  const posts = await prisma.post.findMany({ select: { tags: true } });
  const tips = await prisma.tip.findMany({ select: { tags: true } });
  const videos = await prisma.video.findMany({ select: { tags: true } });

  const allTags = new Set<string>();
  [...posts, ...tips, ...videos].forEach((item) => {
    parseTags(item.tags).forEach((tag) => allTags.add(tag));
  });

  return Array.from(allTags)
    .sort()
    .map((name) => ({ name }));
}

export class AdminPostController {
  async index(req: Request, res: Response): Promise<void> {
    const posts = await postRepository.findAll();

    res.render('admin/posts/index', {
      title: 'Manage Posts',
      posts: posts.map((p: Post) => ({
        ...p,
        tagNames: parseTags(p.tags),
      })),
    });
  }

  async create(req: Request, res: Response): Promise<void> {
    const tags = await getAllUniqueTags();
    res.render('admin/posts/create', {
      title: 'Create Post',
      errors: {},
      old: {},
      tags,
    });
  }

  async store(req: Request, res: Response): Promise<void> {
    const { title, body, tags } = req.body;

    // Validation
    const errors: Record<string, string> = {};
    if (!title || title.trim() === '') errors.title = 'Title is required';
    if (!body || body.trim() === '') errors.body = 'Body is required';

    if (Object.keys(errors).length > 0) {
      const availableTags = await getAllUniqueTags();
      res.render('admin/posts/create', {
        title: 'Create Post',
        errors,
        old: { title, body, tags },
        tags: availableTags,
      });
      return;
    }

    const tagList = tags ? (Array.isArray(tags) ? tags : [tags]) : [];

    await postRepository.create({
      title: title.trim(),
      body: body.trim(),
      tags: tagList,
    });

    req.session.flash = { success: ['Post created successfully'] };
    res.redirect('/admin/posts');
  }

  async edit(req: Request, res: Response): Promise<void> {
    if (!req.params.id) {
      res.status(404).render('errors/404', { message: 'Post not found' });
      return;
    }

    const post = await postRepository.findById(parseInt(req.params.id, 10));

    if (!post) {
      res.status(404).render('errors/404', { message: 'Post not found' });
      return;
    }

    const tags = await getAllUniqueTags();
    res.render('admin/posts/edit', {
      title: 'Edit Post',
      post: {
        ...post,
        tagNames: parseTags(post.tags),
      },
      tags,
      errors: {},
    });
  }

  async update(req: Request, res: Response): Promise<void> {
    if (!req.params.id) {
      res.status(404).render('errors/404', { message: 'Post not found' });
      return;
    }

    const id = parseInt(req.params.id, 10);
    const { title, body, tags } = req.body;

    const post = await postRepository.findById(id);
    if (!post) {
      res.status(404).render('errors/404', { message: 'Post not found' });
      return;
    }

    // Validation
    const errors: Record<string, string> = {};
    if (!title || title.trim() === '') errors.title = 'Title is required';
    if (!body || body.trim() === '') errors.body = 'Body is required';

    if (Object.keys(errors).length > 0) {
      const availableTags = await getAllUniqueTags();
      res.render('admin/posts/edit', {
        title: 'Edit Post',
        post: { ...post, title, body, tagNames: tags || [] },
        tags: availableTags,
        errors,
      });
      return;
    }

    const tagList = tags ? (Array.isArray(tags) ? tags : [tags]) : [];

    await postRepository.update(id, {
      title: title.trim(),
      body: body.trim(),
      tags: tagList,
    });

    req.session.flash = { success: ['Post updated successfully'] };
    res.redirect('/admin/posts');
  }

  async togglePublish(req: Request, res: Response): Promise<void> {
    if (!req.params.id) {
      res.status(404).render('errors/404', { message: 'Post not found' });
      return;
    }

    const id = parseInt(req.params.id, 10);

    const post = await postRepository.findById(id);
    if (!post) {
      res.status(404).render('errors/404', { message: 'Post not found' });
      return;
    }

    await postRepository.togglePublish(id);

    const status = post.publishedAt ? 'unpublished' : 'published';
    req.session.flash = { success: [`Post ${status} successfully`] };
    res.redirect('/admin/posts');
  }

  async destroy(req: Request, res: Response): Promise<void> {
    if (!req.params.id) {
      res.status(404).render('errors/404', { message: 'Post not found' });
      return;
    }

    const id = parseInt(req.params.id, 10);

    await postRepository.delete(id);

    req.session.flash = { success: ['Post deleted successfully'] };
    res.redirect('/admin/posts');
  }
}

export const adminPostController = new AdminPostController();
