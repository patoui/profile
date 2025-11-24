import { Request, Response } from 'express';
import { tipRepository } from '../../repositories/index.js';
import { Tip } from '../../../generated/prisma/client.js';

function parseTags(tagsJson: string): string[] {
  try {
    return JSON.parse(tagsJson) as string[];
  } catch {
    return [];
  }
}

export class AdminTipController {
  async index(req: Request, res: Response): Promise<void> {
    const tips = await tipRepository.findAll();

    res.render('admin/tips/index', {
      title: 'Manage Tips',
      tips: tips.map((t: Tip) => ({
        ...t,
        tagNames: parseTags(t.tags),
      })),
    });
  }

  async create(req: Request, res: Response): Promise<void> {
    res.render('admin/tips/create', {
      title: 'Create Tip',
      errors: {},
      old: {},
    });
  }

  async store(req: Request, res: Response): Promise<void> {
    const { title, body, tags } = req.body;

    // Validation
    const errors: Record<string, string> = {};
    if (!title || title.trim() === '') errors.title = 'Title is required';
    if (!body || body.trim() === '') errors.body = 'Body is required';

    if (Object.keys(errors).length > 0) {
      res.render('admin/tips/create', {
        title: 'Create Tip',
        errors,
        old: { title, body, tags },
      });
      return;
    }

    const tagList = tags ? (Array.isArray(tags) ? tags : [tags]) : [];

    await tipRepository.create({
      title: title.trim(),
      body: body.trim(),
      tags: tagList,
    });

    req.session.flash = { success: ['Tip created successfully'] };
    res.redirect('/admin/tips');
  }

  async edit(req: Request, res: Response): Promise<void> {
    if (!req.params.id) {
      res.status(404).render('errors/404', { message: 'Tip not found' });
      return;
    }

    const tip = await tipRepository.findById(parseInt(req.params.id, 10));

    if (!tip) {
      res.status(404).render('errors/404', { message: 'Tip not found' });
      return;
    }

    res.render('admin/tips/edit', {
      title: 'Edit Tip',
      tip: {
        ...tip,
        tagNames: parseTags(tip.tags),
      },
      errors: {},
    });
  }

  async update(req: Request, res: Response): Promise<void> {
    if (!req.params.id) {
      res.status(404).render('errors/404', { message: 'Tip not found' });
      return;
    }

    const id = parseInt(req.params.id, 10);
    const { title, body, tags } = req.body;

    const tip = await tipRepository.findById(id);
    if (!tip) {
      res.status(404).render('errors/404', { message: 'Tip not found' });
      return;
    }

    // Validation
    const errors: Record<string, string> = {};
    if (!title || title.trim() === '') errors.title = 'Title is required';
    if (!body || body.trim() === '') errors.body = 'Body is required';

    if (Object.keys(errors).length > 0) {
      res.render('admin/tips/edit', {
        title: 'Edit Tip',
        tip: { ...tip, title, body, tagNames: tags || [] },
        errors,
      });
      return;
    }

    const tagList = tags ? (Array.isArray(tags) ? tags : [tags]) : [];

    await tipRepository.update(id, {
      title: title.trim(),
      body: body.trim(),
      tags: tagList,
    });

    req.session.flash = { success: ['Tip updated successfully'] };
    res.redirect('/admin/tips');
  }

  async togglePublish(req: Request, res: Response): Promise<void> {
    if (!req.params.id) {
      res.status(404).render('errors/404', { message: 'Tip not found' });
      return;
    }

    const id = parseInt(req.params.id, 10);

    const tip = await tipRepository.findById(id);
    if (!tip) {
      res.status(404).render('errors/404', { message: 'Tip not found' });
      return;
    }

    await tipRepository.togglePublish(id);

    const status = tip.publishedAt ? 'unpublished' : 'published';
    req.session.flash = { success: [`Tip ${status} successfully`] };
    res.redirect('/admin/tips');
  }

  async destroy(req: Request, res: Response): Promise<void> {
    if (!req.params.id) {
      res.status(404).render('errors/404', { message: 'Tip not found' });
      return;
    }

    const id = parseInt(req.params.id, 10);

    await tipRepository.delete(id);

    req.session.flash = { success: ['Tip deleted successfully'] };
    res.redirect('/admin/tips');
  }
}

export const adminTipController = new AdminTipController();
