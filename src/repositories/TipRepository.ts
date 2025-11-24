import { Tip } from '../../generated/prisma/client.js';
import { prisma } from '../../lib/prisma.js';
import { generateSlug } from '../utils/helpers.js';
import { TipInput } from '../types/index.js';

export class TipRepository {
  async findAll(): Promise<Tip[]> {
    return prisma.tip.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findPublished(tagName?: string): Promise<Tip[]> {
    const tips = await prisma.tip.findMany({
      where: {
        publishedAt: { not: null, lte: new Date() },
      },
      orderBy: { publishedAt: 'desc' },
    });

    if (tagName) {
      return tips.filter((tip: Tip) => {
        const tags = JSON.parse(tip.tags) as string[];
        return tags.includes(tagName);
      });
    }

    return tips;
  }

  async findBySlug(slug: string): Promise<Tip | null> {
    return prisma.tip.findUnique({
      where: { slug },
    });
  }

  async findById(id: number): Promise<Tip | null> {
    return prisma.tip.findUnique({
      where: { id },
    });
  }

  async create(input: TipInput): Promise<Tip> {
    const slug = generateSlug(input.title);

    return prisma.tip.create({
      data: {
        title: input.title,
        slug,
        body: input.body,
        tags: JSON.stringify(input.tags || []),
      },
    });
  }

  async update(id: number, input: TipInput): Promise<Tip> {
    const data: { title: string; body: string; tags?: string } = {
      title: input.title,
      body: input.body,
    };

    if (input.tags !== undefined) {
      data.tags = JSON.stringify(input.tags);
    }

    return prisma.tip.update({
      where: { id },
      data,
    });
  }

  async togglePublish(id: number): Promise<Tip> {
    const tip = await prisma.tip.findUnique({ where: { id } });
    if (!tip) throw new Error('Tip not found');

    return prisma.tip.update({
      where: { id },
      data: {
        publishedAt: tip.publishedAt ? null : new Date(),
      },
    });
  }

  async delete(id: number): Promise<void> {
    await prisma.tip.delete({ where: { id } });
  }

  async getPreviousPublished(currentTip: Tip): Promise<Tip | null> {
    if (!currentTip.publishedAt) return null;

    return prisma.tip.findFirst({
      where: {
        publishedAt: { not: null, lt: currentTip.publishedAt },
      },
      orderBy: { publishedAt: 'desc' },
    });
  }

  async getNextPublished(currentTip: Tip): Promise<Tip | null> {
    if (!currentTip.publishedAt) return null;

    return prisma.tip.findFirst({
      where: {
        publishedAt: { not: null, gt: currentTip.publishedAt },
      },
      orderBy: { publishedAt: 'asc' },
    });
  }

  async countAll(): Promise<number> {
    return prisma.tip.count();
  }

  async countPublished(): Promise<number> {
    return prisma.tip.count({
      where: { publishedAt: { not: null, lte: new Date() } },
    });
  }
}

export const tipRepository = new TipRepository();
