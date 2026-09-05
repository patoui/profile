import type { Analytic } from '../types/prisma.js';
import { prisma } from '../lib/prisma.js';
import { Request } from 'express';

type AnalyticalType = 'App\\Post' | 'App\\Tip' | 'App\\Video';

export class AnalyticRepository {
  async record(
    type: 'post' | 'tip' | 'video',
    id: number,
    req: Request
  ): Promise<Analytic> {
    const headers = JSON.stringify({
      userAgent: req.get('user-agent') || '',
      ip: req.ip || req.socket.remoteAddress || '',
      referer: req.get('referer') || '',
    });

    const analyticalType = this.getAnalyticalType(type);

    return await prisma.analytic.create({
      data: {
        analyticalId: id,
        analyticalType,
        headers,
      },
    });
  }

  async countByPost(postId: number): Promise<number> {
    return prisma.analytic.count({
      where: {
        analyticalId: postId,
        analyticalType: 'App\\Post',
      },
    });
  }

  async countByTip(tipId: number): Promise<number> {
    return prisma.analytic.count({
      where: {
        analyticalId: tipId,
        analyticalType: 'App\\Tip',
      },
    });
  }

  async countByVideo(videoId: number): Promise<number> {
    return prisma.analytic.count({
      where: {
        analyticalId: videoId,
        analyticalType: 'App\\Video',
      },
    });
  }

  async getTotalCounts(): Promise<{
    posts: number;
    tips: number;
    videos: number;
    total: number;
  }> {
    const [posts, tips, videos] = await Promise.all([
      prisma.analytic.count({ where: { analyticalType: 'App\\Post' } }),
      prisma.analytic.count({ where: { analyticalType: 'App\\Tip' } }),
      prisma.analytic.count({ where: { analyticalType: 'App\\Video' } }),
    ]);

    return {
      posts,
      tips,
      videos,
      total: posts + tips + videos,
    };
  }

  private getAnalyticalType(type: 'post' | 'tip' | 'video'): AnalyticalType {
    switch (type) {
      case 'post':
        return 'App\\Post';
      case 'tip':
        return 'App\\Tip';
      case 'video':
        return 'App\\Video';
    }
  }
}

export const analyticRepository = new AnalyticRepository();
