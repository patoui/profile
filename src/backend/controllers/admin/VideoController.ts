import { Request, Response } from 'express';
import { videoRepository } from '../../repositories/index.js';
import { Video } from '../../generated/prisma/client.js';

function parseTags(tagsJson: string): string[] {
  try {
    return JSON.parse(tagsJson) as string[];
  } catch {
    return [];
  }
}

export class AdminVideoController {
  async index(req: Request, res: Response): Promise<void> {
    const videos = await videoRepository.findAll();

    res.render('admin/videos/index', {
      title: 'Manage Videos',
      videos: videos.map((v: Video) => ({
        ...v,
        tagNames: parseTags(v.tags),
      })),
    });
  }

  async create(req: Request, res: Response): Promise<void> {
    res.render('admin/videos/create', {
      title: 'Create Video',
      errors: {},
      old: {},
    });
  }

  async store(req: Request, res: Response): Promise<void> {
    const { title, description, externalId, tags } = req.body;

    // Validation
    const errors: Record<string, string> = {};
    if (!title || title.trim() === '') errors['title'] = 'Title is required';
    if (!description || description.trim() === '')
      errors['description'] = 'Description is required';
    if (!externalId || externalId.trim() === '')
      errors['externalId'] = 'YouTube Video ID is required';

    if (Object.keys(errors).length > 0) {
      res.render('admin/videos/create', {
        title: 'Create Video',
        errors,
        old: { title, description, externalId, tags },
      });
      return;
    }

    const tagList = tags ? (Array.isArray(tags) ? tags : [tags]) : [];

    await videoRepository.create({
      title: title.trim(),
      description: description.trim(),
      externalId: externalId.trim(),
      tags: tagList,
    });

    req.session.flash = { success: ['Video created successfully'] };
    res.redirect('/admin/videos');
  }

  async edit(req: Request, res: Response): Promise<void> {
    if (!req.params['id']) {
      res.status(404).render('errors/404', { message: 'Video not found' });
      return;
    }

    const video = await videoRepository.findById(parseInt(req.params['id'], 10));

    if (!video) {
      res.status(404).render('errors/404', { message: 'Video not found' });
      return;
    }

    res.render('admin/videos/edit', {
      title: 'Edit Video',
      video: {
        ...video,
        tagNames: parseTags(video.tags),
      },
      errors: {},
    });
  }

  async update(req: Request, res: Response): Promise<void> {
    if (!req.params['id']) {
      res.status(404).render('errors/404', { message: 'Video not found' });
      return;
    }

    const id = parseInt(req.params['id'], 10);
    const { title, description, externalId, tags } = req.body;

    const video = await videoRepository.findById(id);
    if (!video) {
      res.status(404).render('errors/404', { message: 'Video not found' });
      return;
    }

    // Validation
    const errors: Record<string, string> = {};
    if (!title || title.trim() === '') errors['title'] = 'Title is required';
    if (!description || description.trim() === '')
      errors['description'] = 'Description is required';
    if (!externalId || externalId.trim() === '')
      errors['externalId'] = 'YouTube Video ID is required';

    if (Object.keys(errors).length > 0) {
      res.render('admin/videos/edit', {
        title: 'Edit Video',
        video: { ...video, title, description, externalId, tagNames: tags || [] },
        errors,
      });
      return;
    }

    const tagList = tags ? (Array.isArray(tags) ? tags : [tags]) : [];

    await videoRepository.update(id, {
      title: title.trim(),
      description: description.trim(),
      externalId: externalId.trim(),
      tags: tagList,
    });

    req.session.flash = { success: ['Video updated successfully'] };
    res.redirect('/admin/videos');
  }

  async togglePublish(req: Request, res: Response): Promise<void> {
    if (!req.params['id']) {
      res.status(404).render('errors/404', { message: 'Video not found' });
      return;
    }

    const id = parseInt(req.params['id'], 10);

    const video = await videoRepository.findById(id);
    if (!video) {
      res.status(404).render('errors/404', { message: 'Video not found' });
      return;
    }

    await videoRepository.togglePublish(id);

    const status = video.publishedAt ? 'unpublished' : 'published';
    req.session.flash = { success: [`Video ${status} successfully`] };
    res.redirect('/admin/videos');
  }

  async destroy(req: Request, res: Response): Promise<void> {
    if (!req.params['id']) {
      res.status(404).render('errors/404', { message: 'Video not found' });
      return;
    }

    const id = parseInt(req.params['id'], 10);

    await videoRepository.delete(id);

    req.session.flash = { success: ['Video deleted successfully'] };
    res.redirect('/admin/videos');
  }
}

export const adminVideoController = new AdminVideoController();
