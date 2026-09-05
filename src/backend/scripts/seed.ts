import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma.js";

async function main() {
  const hashedPassword = await bcrypt.hash("password", 10);

  const adminUser = await prisma.user.upsert({
    where: { email: "patrique.ouimet@gmail.com" },
    update: {},
    create: {
      name: "Patrique Ouimet",
      email: "patrique.ouimet@gmail.com",
      password: hashedPassword,
      emailVerifiedAt: new Date(),
    },
  });

  console.log("Created admin user:", adminUser.email);

  const samplePost = await prisma.post.upsert({
    where: { slug: "welcome-to-my-blog" },
    update: {},
    create: {
      title: "Welcome to My Blog",
      slug: "welcome-to-my-blog",
      body: "# Welcome\n\nThis is my personal blog where I share my thoughts on software development.",
      tags: JSON.stringify(["php", "laravel", "devops"]),
      publishedAt: new Date(),
    },
  });

  console.log("Created sample post:", samplePost.title);

  const sampleTip = await prisma.tip.upsert({
    where: { slug: "typescript-strict-mode" },
    update: {},
    create: {
      title: "Always Use TypeScript Strict Mode",
      slug: "typescript-strict-mode",
      body: "Enable `strict: true` in your tsconfig.json for better type safety.",
      tags: JSON.stringify(["typescript", "tooling"]),
      publishedAt: new Date(),
    },
  });

  console.log("Created sample tip:", sampleTip.title);

  const sampleVideo = await prisma.video.upsert({
    where: { slug: "build-fast-with-typescript" },
    update: {},
    create: {
      title: "Build Fast with TypeScript",
      slug: "build-fast-with-typescript",
      description:
        "A short walkthrough of keeping TypeScript builds fast and maintainable.",
      externalId: "dQw4w9WgXcQ",
      tags: JSON.stringify(["typescript", "video"]),
      publishedAt: new Date(),
    },
  });

  console.log("Created sample video:", sampleVideo.title);

  console.log("Seeding completed!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
