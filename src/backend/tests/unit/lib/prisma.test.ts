import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { writeFileSync, unlinkSync } from 'fs';
import { resolve } from 'path';

describe('prisma create prisma client', () => {
  it('should throw an error if DATABASE_URL is not set', async () => {
    delete process.env['DATABASE_URL'];

    const { prisma } = await import('../../../lib/prisma.js');

    expect(() => prisma.user).toThrowError('DATABASE_URL environment variable is not set');
  });
});

describe('prisma module singleton behavior', () => {
  const testDbPath = resolve(process.cwd(), 'test-prisma.db');
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };

    // Create a temporary database file for testing
    writeFileSync(testDbPath, '');
    process.env['DATABASE_URL'] = `file:${testDbPath}`;
  });

  afterEach(() => {
    process.env = originalEnv;
    try {
      unlinkSync(testDbPath);
    } catch {
      // Ignore cleanup errors
    }
  });

  it('should create instance only once and reuse it on subsequent accesses', async () => {
    // Mock PrismaClient to track construction calls
    let constructorCalls = 0;
    const mockInstance = {
      user: { findMany: vi.fn() },
      post: { findMany: vi.fn() },
      $disconnect: vi.fn()
    };

    vi.doMock('../../../generated/prisma/client.js', () => ({
      PrismaClient: vi.fn().mockImplementation(function() {
        constructorCalls++;
        return mockInstance;
      })
    }));

    vi.doMock('@prisma/adapter-better-sqlite3', () => ({
      PrismaBetterSqlite3: vi.fn().mockImplementation(function() {
        return { url: 'mock' };
      })
    }));

    // Import the prisma module
    const { prisma } = await import('../../../lib/prisma.js');

    // First access should create the instance
    const user1 = prisma.user;
    expect(constructorCalls).toBe(1);

    // Second access should reuse the same instance
    const user2 = prisma.user;
    expect(constructorCalls).toBe(1); // Should still be 1, not 2

    // Third access to different property should also reuse instance
    const post1 = prisma.post;
    expect(constructorCalls).toBe(1); // Should still be 1

    // Verify we get the same references
    expect(user1).toBe(user2);
    expect(user1).toBe(mockInstance.user);
    expect(post1).toBe(mockInstance.post);
  });

  it('should handle the lazy initialization correctly', async () => {
    let constructorCalls = 0;
    const mockInstance = {
      user: { findMany: vi.fn() },
      $connect: vi.fn()
    };

    vi.doMock('../../../generated/prisma/client.js', () => ({
      PrismaClient: vi.fn().mockImplementation(function() {
        constructorCalls++;
        return mockInstance;
      })
    }));

    vi.doMock('@prisma/adapter-better-sqlite3', () => ({
      PrismaBetterSqlite3: vi.fn().mockImplementation(function() {
        return { url: 'mock' };
      })
    }));

    const { prisma } = await import('../../../lib/prisma.js');

    // Before any access, no instance should be created
    expect(constructorCalls).toBe(0);

    // First property access triggers creation
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    prisma.user;
    expect(constructorCalls).toBe(1);

    // Subsequent accesses don't create new instances
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    prisma.$connect;
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    prisma.user;
    expect(constructorCalls).toBe(1);
  });
});