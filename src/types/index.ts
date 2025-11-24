import { User } from '../../generated/prisma/client.js';

// Extend Express Session
declare module 'express-session' {
  interface SessionData {
    userId?: number;
    flash?: {
      success?: string[];
      error?: string[];
      info?: string[];
    };
  }
}

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
    interface Locals {
      user: User | null;
      isAdmin: boolean;
      appName: string;
      flash: {
        success: string[];
        error: string[];
        info: string[];
      };
      setFlash?: (type: 'success' | 'error' | 'info', message: string) => void;
    }
  }
}

export interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface ContentItem {
  id: number;
  title: string;
  slug: string;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PostInput {
  title: string;
  body: string;
  tags?: string[];
}

export interface TipInput {
  title: string;
  body: string;
  tags?: string[];
}

export interface VideoInput {
  title: string;
  description: string;
  externalId: string;
  tags?: string[];
}
