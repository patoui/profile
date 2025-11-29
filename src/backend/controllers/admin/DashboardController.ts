import { Request, Response } from 'express';
import {
  postRepository,
  tipRepository,
  videoRepository,
  analyticRepository,
} from '../../repositories/index.js';

function parseTags(tagsJson: string): string[] {
  try {
    return JSON.parse(tagsJson) as string[];
  } catch {
    return [];
  }
}

async function getTagsWithCounts(): Promise<
  Array<{ name: string; postCount: number; tipCount: number; videoCount: number }>
> {
  const [posts, tips, videos] = await Promise.all([
    postRepository.findAll(),
    tipRepository.findAll(),
    videoRepository.findAll(),
  ]);

  const tagCounts = new Map<
    string,
    { postCount: number; tipCount: number; videoCount: number }
  >();

  for (const post of posts) {
    for (const tag of parseTags(post.tags)) {
      const counts = tagCounts.get(tag) || { postCount: 0, tipCount: 0, videoCount: 0 };
      counts.postCount++;
      tagCounts.set(tag, counts);
    }
  }

  for (const tip of tips) {
    for (const tag of parseTags(tip.tags)) {
      const counts = tagCounts.get(tag) || { postCount: 0, tipCount: 0, videoCount: 0 };
      counts.tipCount++;
      tagCounts.set(tag, counts);
    }
  }

  for (const video of videos) {
    for (const tag of parseTags(video.tags)) {
      const counts = tagCounts.get(tag) || { postCount: 0, tipCount: 0, videoCount: 0 };
      counts.videoCount++;
      tagCounts.set(tag, counts);
    }
  }

  return Array.from(tagCounts.entries())
    .map(([name, counts]) => ({ name, ...counts }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export class DashboardController {
  async index(req: Request, res: Response): Promise<void> {
    const [
      postsCount,
      postsPublished,
      tipsCount,
      tipsPublished,
      videosCount,
      videosPublished,
      tagsWithCounts,
      analyticCounts,
    ] = await Promise.all([
      postRepository.countAll(),
      postRepository.countPublished(),
      tipRepository.countAll(),
      tipRepository.countPublished(),
      videoRepository.countAll(),
      videoRepository.countPublished(),
      getTagsWithCounts(),
      analyticRepository.getTotalCounts(),
    ]);

    res.render('admin/dashboard', {
      title: 'Dashboard',
      stats: {
        posts: { total: postsCount, published: postsPublished },
        tips: { total: tipsCount, published: tipsPublished },
        videos: { total: videosCount, published: videosPublished },
      },
      tags: tagsWithCounts,
      analytics: analyticCounts,
    });
  }
}

export const dashboardController = new DashboardController();
