import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';
import bcrypt from 'bcrypt';

const libsql = createClient({
  url: process.env.DATABASE_URL!,
});

const adapter = new PrismaLibSql(libsql);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Create admin user
  const hashedPassword = await bcrypt.hash('password', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'patrique.ouimet@gmail.com' },
    update: {},
    create: {
      name: 'Patrique Ouimet',
      email: 'patrique.ouimet@gmail.com',
      password: hashedPassword,
      emailVerifiedAt: new Date(),
    },
  });

  console.log('Created admin user:', adminUser.email);

  // Create some tags
  const tagNames = ['PHP', 'Laravel', 'JavaScript', 'TypeScript', 'Node.js', 'DevOps', 'Docker'];

  for (const name of tagNames) {
    await prisma.tag.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log('Created tags:', tagNames.join(', '));

  // Create a sample post
  const samplePost = await prisma.post.upsert({
    where: { slug: 'welcome-to-my-blog' },
    update: {},
    create: {
      title: 'Welcome to My Blog',
      slug: 'welcome-to-my-blog',
      body: '# Welcome\n\nThis is my personal blog where I share my thoughts on software development.',
      publishedAt: new Date(),
    },
  });

  console.log('Created sample post:', samplePost.title);

  // Create a sample tip
  const sampleTip = await prisma.tip.upsert({
    where: { slug: 'typescript-strict-mode' },
    update: {},
    create: {
      title: 'Always Use TypeScript Strict Mode',
      slug: 'typescript-strict-mode',
      body: 'Enable `strict: true` in your tsconfig.json for better type safety.',
      publishedAt: new Date(),
    },
  });

  console.log('Created sample tip:', sampleTip.title);

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
