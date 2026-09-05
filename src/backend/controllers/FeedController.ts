import { Request, Response } from 'express';
import { Feed } from 'feed';
import { postRepository, tipRepository, videoRepository } from '../repositories/index.js';
import type { Post, Tip, Video } from '../types/prisma.js';

const APP_NAME = process.env['APP_NAME'] || 'Patrique Ouimet';
const BASE_URL = process.env['BASE_URL'] || 'http://localhost:3000';

export class FeedController {
  async posts(req: Request, res: Response): Promise<void> {
    const posts = await postRepository.findPublished();

    const feed = new Feed({
      title: `${APP_NAME} - Blog Posts`,
      description: 'Latest blog posts',
      id: `${BASE_URL}/blog`,
      link: `${BASE_URL}/blog`,
      language: 'en',
      copyright: `All rights reserved ${new Date().getFullYear()}, ${APP_NAME}`,
      feedLinks: {
        rss2: `${BASE_URL}/feeds/posts`,
      },
      author: {
        name: APP_NAME,
        link: BASE_URL,
      },
    });

    posts.forEach((post: Post) => {
      feed.addItem({
        title: post.title,
        id: `${BASE_URL}/post/${post.slug}`,
        link: `${BASE_URL}/post/${post.slug}`,
        description: post.body.substring(0, 200) + '...',
        content: post.body,
        date: post.publishedAt || post.createdAt,
      });
    });

    res.set('Content-Type', 'application/rss+xml');
    res.send(feed.rss2());
  }

  async tips(req: Request, res: Response): Promise<void> {
    const tips = await tipRepository.findPublished();

    const feed = new Feed({
      title: `${APP_NAME} - Tips`,
      description: 'Latest tips',
      id: `${BASE_URL}/tip`,
      link: `${BASE_URL}/tip`,
      language: 'en',
      copyright: `All rights reserved ${new Date().getFullYear()}, ${APP_NAME}`,
      feedLinks: {
        rss2: `${BASE_URL}/feeds/tips`,
      },
      author: {
        name: APP_NAME,
        link: BASE_URL,
      },
    });

    tips.forEach((tip: Tip) => {
      feed.addItem({
        title: tip.title,
        id: `${BASE_URL}/tip/${tip.slug}`,
        link: `${BASE_URL}/tip/${tip.slug}`,
        description: tip.body.substring(0, 200) + '...',
        content: tip.body,
        date: tip.publishedAt || tip.createdAt,
      });
    });

    res.set('Content-Type', 'application/rss+xml');
    res.send(feed.rss2());
  }

  async videos(req: Request, res: Response): Promise<void> {
    const videos = await videoRepository.findPublished();

    const feed = new Feed({
      title: `${APP_NAME} - Videos`,
      description: 'Latest videos',
      id: `${BASE_URL}/video`,
      link: `${BASE_URL}/video`,
      language: 'en',
      copyright: `All rights reserved ${new Date().getFullYear()}, ${APP_NAME}`,
      feedLinks: {
        rss2: `${BASE_URL}/feeds/videos`,
      },
      author: {
        name: APP_NAME,
        link: BASE_URL,
      },
    });

    videos.forEach((video: Video) => {
      feed.addItem({
        title: video.title,
        id: `${BASE_URL}/video/${video.slug}`,
        link: `${BASE_URL}/video/${video.slug}`,
        description: video.description,
        date: video.publishedAt || video.createdAt,
      });
    });

    res.set('Content-Type', 'application/rss+xml');
    res.send(feed.rss2());
  }

  async all(req: Request, res: Response): Promise<void> {
    const [posts, tips, videos] = await Promise.all([
      postRepository.findPublished(),
      tipRepository.findPublished(),
      videoRepository.findPublished(),
    ]);

    const feed = new Feed({
      title: `${APP_NAME} - All Content`,
      description: 'Latest content from all categories',
      id: BASE_URL,
      link: BASE_URL,
      language: 'en',
      copyright: `All rights reserved ${new Date().getFullYear()}, ${APP_NAME}`,
      feedLinks: {
        rss2: `${BASE_URL}/feeds/all`,
      },
      author: {
        name: APP_NAME,
        link: BASE_URL,
      },
    });

    // Combine all items
    const allItems = [
      ...posts.map((p: Post) => ({
        title: p.title,
        link: `${BASE_URL}/post/${p.slug}`,
        description: p.body.substring(0, 200) + '...',
        date: p.publishedAt || p.createdAt,
      })),
      ...tips.map((t: Tip) => ({
        title: t.title,
        link: `${BASE_URL}/tip/${t.slug}`,
        description: t.body.substring(0, 200) + '...',
        date: t.publishedAt || t.createdAt,
      })),
      ...videos.map((v: Video) => ({
        title: v.title,
        link: `${BASE_URL}/video/${v.slug}`,
        description: v.description,
        date: v.publishedAt || v.createdAt,
      })),
    ];

    // Sort by date descending
    allItems.sort((a, b) => b.date.getTime() - a.date.getTime());

    allItems.forEach((item) => {
      feed.addItem({
        title: item.title,
        id: item.link,
        link: item.link,
        description: item.description,
        date: item.date,
      });
    });

    res.set('Content-Type', 'application/rss+xml');
    res.send(feed.rss2());
  }
}

export const feedController = new FeedController();
