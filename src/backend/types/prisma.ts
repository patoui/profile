export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  emailVerifiedAt: Date | null;
  rememberToken: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Post {
  id: number;
  title: string;
  slug: string;
  body: string;
  tags: string;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tip {
  id: number;
  title: string;
  slug: string;
  body: string;
  tags: string;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Video {
  id: number;
  title: string;
  slug: string;
  description: string;
  externalId: string;
  tags: string;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Analytic {
  id: number;
  analyticalId: number;
  analyticalType: string;
  headers: string;
  createdAt: Date;
  updatedAt: Date;
}
