#!/usr/bin/env npx tsx

import Database from "better-sqlite3";

// Parse CLI arguments
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error("Usage: npx tsx migrate.ts <from-db> <to-db>");
  console.error(
    "Example: npx tsx migrate.ts ../laravel-profile/database/database.sqlite ./dev.db"
  );
  process.exit(1);
}

const LARAVEL_DB_PATH = args[0];
const NODE_DB_PATH = args[1];

interface LaravelUser {
  id: number;
  name: string;
  email: string;
  password: string | null;
  email_verified_at: string | null;
  remember_token: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface LaravelPost {
  id: number;
  title: string;
  slug: string | null;
  body: string;
  published_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface LaravelTip {
  id: number;
  title: string;
  slug: string;
  body: string;
  published_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface LaravelVideo {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  external_id: string;
  published_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface LaravelTag {
  id: number;
  name: string; // JSON string: {"en": "value"}
}

interface LaravelTaggable {
  tag_id: number;
  taggable_id: number;
  taggable_type: string;
}

interface LaravelAnalytic {
  id: number;
  analytical_id: number;
  analytical_type: string;
  headers: string | null;
  created_at: string | null;
  updated_at: string | null;
}

function migrate(): void {
  console.log(`Starting migration...`);
  console.log(`  From: ${LARAVEL_DB_PATH}`);
  console.log(`  To:   ${NODE_DB_PATH}\n`);

  const laravelDb = new Database(LARAVEL_DB_PATH, { readonly: true });
  const nodeDb = new Database(NODE_DB_PATH);

  try {
    // Build tag lookup map: tag_id -> tag_name (extracted from JSON)
    const tagMap = buildTagMap(laravelDb);

    // Build taggables lookup: { "App\\Post": { 1: ["laravel", "php"], 2: [...] }, ... }
    const taggablesMap = buildTaggablesMap(laravelDb, tagMap);

    // Disable foreign key checks during migration
    nodeDb.pragma("foreign_keys = OFF");

    // Clear existing data in node db
    console.log("Clearing existing data in target database...");
    nodeDb.exec(`
      DELETE FROM analytics;
      DELETE FROM posts;
      DELETE FROM tips;
      DELETE FROM videos;
      DELETE FROM users;
    `);

    // Reset auto-increment counters
    nodeDb.exec(`
      DELETE FROM sqlite_sequence WHERE name IN ('analytics', 'posts', 'tips', 'videos', 'users');
    `);

    // 1. Migrate users
    console.log("\n[1/5] Migrating users...");
    migrateUsers(laravelDb, nodeDb);

    // 2. Migrate posts with tags
    console.log("[2/5] Migrating posts...");
    migratePosts(laravelDb, nodeDb, taggablesMap["App\\Post"] || {});

    // 3. Migrate tips with tags
    console.log("[3/5] Migrating tips...");
    migrateTips(laravelDb, nodeDb, taggablesMap["App\\Tip"] || {});

    // 4. Migrate videos with tags
    console.log("[4/5] Migrating videos...");
    migrateVideos(laravelDb, nodeDb, taggablesMap["App\\Video"] || {});

    // 5. Migrate analytics (polymorphic)
    console.log("[5/5] Migrating analytics...");
    migrateAnalytics(laravelDb, nodeDb);

    // Re-enable foreign key checks
    nodeDb.pragma("foreign_keys = ON");

    console.log("\n✓ Migration completed successfully!");
  } catch (error) {
    console.error(
      "\n✗ Migration failed:",
      error instanceof Error ? error.message : error
    );
    throw error;
  } finally {
    laravelDb.close();
    nodeDb.close();
  }
}

function buildTagMap(laravelDb: Database.Database): Map<number, string> {
  const tags = laravelDb.prepare("SELECT * FROM tags").all() as LaravelTag[];
  const tagMap = new Map<number, string>();

  for (const tag of tags) {
    // Extract name from JSON: {"en": "laravel"} -> "laravel"
    let name = tag.name;
    try {
      const parsed = JSON.parse(tag.name);
      name = parsed.en || Object.values(parsed)[0] || tag.name;
    } catch {
      // If not valid JSON, use as-is
    }
    tagMap.set(tag.id, name);
  }

  console.log(`Built tag map with ${tagMap.size} tags`);
  return tagMap;
}

function buildTaggablesMap(
  laravelDb: Database.Database,
  tagMap: Map<number, string>
): Record<string, Record<number, string[]>> {
  const taggables = laravelDb
    .prepare("SELECT * FROM taggables")
    .all() as LaravelTaggable[];

  const result: Record<string, Record<number, string[]>> = {};

  for (const taggable of taggables) {
    const { taggable_type, taggable_id, tag_id } = taggable;
    const tagName = tagMap.get(tag_id);

    if (!tagName) {
      console.warn(`  Warning: Tag ID ${tag_id} not found in tag map`);
      continue;
    }

    if (!result[taggable_type]) {
      result[taggable_type] = {};
    }

    if (!result[taggable_type][taggable_id]) {
      result[taggable_type][taggable_id] = [];
    }

    result[taggable_type][taggable_id].push(tagName);
  }

  return result;
}

function migrateUsers(
  laravelDb: Database.Database,
  nodeDb: Database.Database
): void {
  const users = laravelDb.prepare("SELECT * FROM users").all() as LaravelUser[];

  const insert = nodeDb.prepare(`
    INSERT INTO users (id, name, email, password, email_verified_at, remember_token, created_at, updated_at)
    VALUES (@id, @name, @email, @password, @email_verified_at, @remember_token, @created_at, @updated_at)
  `);

  let count = 0;
  for (const user of users) {
    insert.run({
      id: user.id,
      name: user.name,
      email: user.email,
      password: user.password || "",
      email_verified_at: user.email_verified_at,
      remember_token: user.remember_token,
      created_at: user.created_at || new Date().toISOString(),
      updated_at: user.updated_at || new Date().toISOString(),
    });
    count++;
  }
  console.log(`   Migrated ${count} users`);
}

function migratePosts(
  laravelDb: Database.Database,
  nodeDb: Database.Database,
  tagsMap: Record<number, string[]>
): void {
  const posts = laravelDb.prepare("SELECT * FROM posts").all() as LaravelPost[];

  const insert = nodeDb.prepare(`
    INSERT INTO posts (id, title, slug, body, tags, published_at, created_at, updated_at)
    VALUES (@id, @title, @slug, @body, @tags, @published_at, @created_at, @updated_at)
  `);

  let count = 0;
  for (const post of posts) {
    const tags = tagsMap[post.id] || [];

    insert.run({
      id: post.id,
      title: post.title,
      slug: post.slug || `post-${post.id}`,
      body: post.body,
      tags: JSON.stringify(tags),
      published_at: post.published_at,
      created_at: post.created_at || new Date().toISOString(),
      updated_at: post.updated_at || new Date().toISOString(),
    });
    count++;
  }
  console.log(`   Migrated ${count} posts`);
}

function migrateTips(
  laravelDb: Database.Database,
  nodeDb: Database.Database,
  tagsMap: Record<number, string[]>
): void {
  const tips = laravelDb.prepare("SELECT * FROM tips").all() as LaravelTip[];

  const insert = nodeDb.prepare(`
    INSERT INTO tips (id, title, slug, body, tags, published_at, created_at, updated_at)
    VALUES (@id, @title, @slug, @body, @tags, @published_at, @created_at, @updated_at)
  `);

  let count = 0;
  for (const tip of tips) {
    const tags = tagsMap[tip.id] || [];

    insert.run({
      id: tip.id,
      title: tip.title,
      slug: tip.slug,
      body: tip.body,
      tags: JSON.stringify(tags),
      published_at: tip.published_at,
      created_at: tip.created_at || new Date().toISOString(),
      updated_at: tip.updated_at || new Date().toISOString(),
    });
    count++;
  }
  console.log(`   Migrated ${count} tips`);
}

function migrateVideos(
  laravelDb: Database.Database,
  nodeDb: Database.Database,
  tagsMap: Record<number, string[]>
): void {
  const videos = laravelDb
    .prepare("SELECT * FROM videos")
    .all() as LaravelVideo[];

  const insert = nodeDb.prepare(`
    INSERT INTO videos (id, title, slug, description, external_id, tags, published_at, created_at, updated_at)
    VALUES (@id, @title, @slug, @description, @external_id, @tags, @published_at, @created_at, @updated_at)
  `);

  let count = 0;
  for (const video of videos) {
    const tags = tagsMap[video.id] || [];

    insert.run({
      id: video.id,
      title: video.title,
      slug: video.slug,
      description: video.description || "",
      external_id: video.external_id,
      tags: JSON.stringify(tags),
      published_at: video.published_at,
      created_at: video.created_at || new Date().toISOString(),
      updated_at: video.updated_at || new Date().toISOString(),
    });
    count++;
  }
  console.log(`   Migrated ${count} videos`);
}

function migrateAnalytics(
  laravelDb: Database.Database,
  nodeDb: Database.Database
): void {
  const analytics = laravelDb
    .prepare("SELECT * FROM analytics")
    .all() as LaravelAnalytic[];

  const insert = nodeDb.prepare(`
    INSERT INTO analytics (id, analytical_id, analytical_type, headers, created_at, updated_at)
    VALUES (@id, @analytical_id, @analytical_type, @headers, @created_at, @updated_at)
  `);

  let count = 0;
  for (const analytic of analytics) {
    insert.run({
      id: analytic.id,
      analytical_id: analytic.analytical_id,
      analytical_type: analytic.analytical_type,
      headers: analytic.headers || "{}",
      created_at: analytic.created_at || new Date().toISOString(),
      updated_at: analytic.updated_at || new Date().toISOString(),
    });
    count++;
  }
  console.log(`   Migrated ${count} analytics records`);
}

// Run migration
migrate();
