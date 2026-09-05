import type { Video } from '../types/prisma.js';
import { prisma } from '../lib/prisma.js';
import { generateSlug } from '../utils/helpers.js';
import { VideoInput } from '../types/index.js';

export class VideoRepository {
  async findAll(): Promise<Video[]> {
    return prisma.video.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findPublished(tagName?: string): Promise<Video[]> {
    const videos = await prisma.video.findMany({
      where: {
        publishedAt: { not: null, lte: new Date() },
      },
      orderBy: { publishedAt: 'desc' },
    });

    if (tagName) {
      return videos.filter((video: Video) => {
        const tags = JSON.parse(video.tags) as string[];
        return tags.includes(tagName);
      });
    }

    return videos;
  }

  async findBySlug(slug: string): Promise<Video | null> {
    return prisma.video.findUnique({
      where: { slug },
    });
  }

  async findById(id: number): Promise<Video | null> {
    return prisma.video.findUnique({
      where: { id },
    });
  }

  async create(input: VideoInput): Promise<Video> {
    const slug = generateSlug(input.title);

    return prisma.video.create({
      data: {
        title: input.title,
        slug,
        description: input.description,
        externalId: input.externalId,
        tags: JSON.stringify(input.tags || []),
      },
    });
  }

  async update(id: number, input: VideoInput): Promise<Video> {
    const data: {
      title: string;
      description: string;
      externalId: string;
      tags?: string;
    } = {
      title: input.title,
      description: input.description,
      externalId: input.externalId,
    };

    if (input.tags !== undefined) {
      data.tags = JSON.stringify(input.tags);
    }

    return prisma.video.update({
      where: { id },
      data,
    });
  }

  async togglePublish(id: number): Promise<Video> {
    const video = await prisma.video.findUnique({ where: { id } });
    if (!video) throw new Error('Video not found');

    return prisma.video.update({
      where: { id },
      data: {
        publishedAt: video.publishedAt ? null : new Date(),
      },
    });
  }

  async delete(id: number): Promise<void> {
    await prisma.video.delete({ where: { id } });
  }

  async getPreviousPublished(currentVideo: Video): Promise<Video | null> {
    if (!currentVideo.publishedAt) return null;

    return prisma.video.findFirst({
      where: {
        publishedAt: { not: null, lt: currentVideo.publishedAt },
        id: { not: currentVideo.id },
      },
      orderBy: { publishedAt: 'desc' },
    });
  }

  async getNextPublished(currentVideo: Video): Promise<Video | null> {
    if (!currentVideo.publishedAt) return null;

    return prisma.video.findFirst({
      where: {
        publishedAt: { not: null, gt: currentVideo.publishedAt },
        id: { not: currentVideo.id },
      },
      orderBy: { publishedAt: 'desc' },
    });
  }

  async countAll(): Promise<number> {
    return prisma.video.count();
  }

  async countPublished(): Promise<number> {
    return prisma.video.count({
      where: { publishedAt: { not: null, lte: new Date() } },
    });
  }
}

export const videoRepository = new VideoRepository();
