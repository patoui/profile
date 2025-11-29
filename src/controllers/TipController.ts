import { Request, Response } from 'express';
import { tipRepository, analyticRepository } from '../repositories/index.js';
import { parseMarkdown, getShortBody } from '../utils/helpers.js';
import { Tip } from '../../generated/prisma/client.js';

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

export class TipController {
  async index(req: Request, res: Response): Promise<void> {
    const tag = req.query.tag as string | undefined;
    const tips = await tipRepository.findPublished(tag);
    const allTips = await tipRepository.findPublished();
    const tags = getUniqueTags(allTips);

    const tipsWithShortBody = tips.map((tip: Tip) => ({
      ...tip,
      shortBody: getShortBody(tip.body),
      tagNames: parseTags(tip.tags),
    }));

    res.render('tips/index', {
      title: 'Tips & Tricks',
      tips: tipsWithShortBody,
      tags,
      selectedTag: tag || null,
      currentPath: '/tip',
    });
  }

  async show(req: Request, res: Response): Promise<void> {
    if (!req.params.slug) {
      res.status(404).render('errors/404', { message: 'Tip not found' });
      return;
    }

    const tip = await tipRepository.findBySlug(req.params.slug);

    if (!tip || !tip.publishedAt) {
      res.status(404).render('errors/404', { message: 'Tip not found' });
      return;
    }

    analyticRepository.record('tip', tip.id, req).catch(console.error);

    const [nextTip, previousTip] = await Promise.all([
      tipRepository.getNextPublished(tip),
      tipRepository.getPreviousPublished(tip),
    ]);

    res.render('tips/show', {
      title: tip.title,
      tip: {
        ...tip,
        bodyHtml: parseMarkdown(tip.body),
        shortBody: getShortBody(tip.body),
        tagNames: parseTags(tip.tags),
      },
      previousTip,
      nextTip,
      currentPath: '/tip',
    });
  }
}

export const tipController = new TipController();
