import { Request, Response } from 'express';
import { videoRepository, analyticRepository } from '../repositories/index.js';
import { getYouTubeEmbedUrl, getYouTubeThumbnailUrl } from '../utils/helpers.js';
import { Video } from '../../generated/prisma/client.js';

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

export class VideoController {
  async index(req: Request, res: Response): Promise<void> {
    const tag = req.query.tag as string | undefined;
    const videos = await videoRepository.findPublished(tag);
    const allVideos = await videoRepository.findPublished();
    const tags = getUniqueTags(allVideos);

    const videosWithThumbnails = videos.map((video: Video) => ({
      ...video,
      thumbnailUrl: getYouTubeThumbnailUrl(video.externalId),
      tagNames: parseTags(video.tags),
    }));

    res.render('videos/index', {
      title: 'Videos',
      videos: videosWithThumbnails,
      tags,
      selectedTag: tag || null,
      currentPath: '/video',
    });
  }

  async show(req: Request, res: Response): Promise<void> {
    if (!req.params.slug) {
      res.status(404).render('errors/404', { message: 'Video not found' });
      return;
    }
    const video = await videoRepository.findBySlug(req.params.slug);

    if (!video || !video.publishedAt) {
      res.status(404).render('errors/404', { message: 'Video not found' });
      return;
    }

    // Track analytics
    await analyticRepository.record('video', video.id, req);

    // Get previous and next videos
    const [previousVideo, nextVideo] = await Promise.all([
      videoRepository.getPreviousPublished(video),
      videoRepository.getNextPublished(video),
    ]);

    res.render('videos/show', {
      title: video.title,
      video: {
        ...video,
        embedUrl: getYouTubeEmbedUrl(video.externalId),
        tagNames: parseTags(video.tags),
      },
      previousVideo,
      nextVideo,
      currentPath: '/video',
    });
  }
}

export const videoController = new VideoController();
