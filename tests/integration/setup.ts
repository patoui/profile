import { PrismaClient } from '../../generated/prisma/client.js';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { beforeAll, afterAll, beforeEach } from 'vitest';

// Use in-memory SQLite for integration tests
const adapter = new PrismaBetterSqlite3({ url: ':memory:' });
export const testPrisma = new PrismaClient({ adapter });

// SQL statements to create tables (matching the Prisma schema)
const createTableStatements = [
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    email_verified_at DATETIME,
    remember_token TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    body TEXT NOT NULL,
    tags TEXT DEFAULT '[]',
    published_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS tips (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    body TEXT NOT NULL,
    tags TEXT DEFAULT '[]',
    published_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS videos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    external_id TEXT NOT NULL,
    tags TEXT DEFAULT '[]',
    published_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    analytical_id INTEGER NOT NULL,
    analytical_type TEXT NOT NULL,
    headers TEXT DEFAULT '{}',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
];

export async function setupTestDatabase() {
  // Execute each CREATE TABLE statement individually
  for (const sql of createTableStatements) {
    await testPrisma.$executeRawUnsafe(sql);
  }
}

export async function cleanupTestDatabase() {
  // Use transaction for faster cleanup
  await testPrisma.$transaction([
    testPrisma.$executeRawUnsafe('DELETE FROM analytics'),
    testPrisma.$executeRawUnsafe('DELETE FROM posts'),
    testPrisma.$executeRawUnsafe('DELETE FROM tips'),
    testPrisma.$executeRawUnsafe('DELETE FROM videos'),
    testPrisma.$executeRawUnsafe('DELETE FROM users'),
  ]);
}

export function useTestDatabase() {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  beforeEach(async () => {
    await cleanupTestDatabase();
  });

  afterAll(async () => {
    await testPrisma.$disconnect();
  });
}
