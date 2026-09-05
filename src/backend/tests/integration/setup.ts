import { Pool } from 'pg';
import { prisma as testPrisma } from '../../lib/prisma.js';
import { beforeAll, afterAll, beforeEach } from 'vitest';

const connectionString =
  process.env['TEST_DATABASE_URL'] || process.env['DATABASE_URL'];

if (!connectionString) {
  throw new Error('TEST_DATABASE_URL or DATABASE_URL must be set for integration tests');
}

const pool = new Pool({ connectionString });

// SQL statements to create tables (matching the Prisma schema)
const createTableStatements = [
  `CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    email_verified_at TIMESTAMPTZ(3),
    remember_token TEXT,
    created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    body TEXT NOT NULL,
    tags TEXT DEFAULT '[]',
    published_at TIMESTAMPTZ(3),
    created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS tips (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    body TEXT NOT NULL,
    tags TEXT DEFAULT '[]',
    published_at TIMESTAMPTZ(3),
    created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS videos (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    external_id TEXT NOT NULL,
    tags TEXT DEFAULT '[]',
    published_at TIMESTAMPTZ(3),
    created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS analytics (
    id SERIAL PRIMARY KEY,
    analytical_id INTEGER NOT NULL,
    analytical_type TEXT NOT NULL,
    headers TEXT DEFAULT '{}',
    created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
];

export async function setupTestDatabase() {
  await pool.query(`
    DROP TABLE IF EXISTS analytics, videos, tips, posts, users CASCADE
  `);

  for (const sql of createTableStatements) {
    await pool.query(sql);
  }
}

export async function cleanupTestDatabase() {
  await pool.query(`
    TRUNCATE TABLE analytics, posts, tips, videos, users
    RESTART IDENTITY CASCADE
  `);
}

export { testPrisma };

export function useTestDatabase() {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  beforeEach(async () => {
    await cleanupTestDatabase();
  });

  afterAll(async () => {
    await pool.end();
    await testPrisma.$disconnect();
  });
}
