import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma/client.js";
import { existsSync } from 'fs';
import { isAbsolute, resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '../../..');

let prismaInstance: PrismaClient | null = null;

const createPrismaClient = (): PrismaClient => {
  const databaseUrl = process.env['DATABASE_URL'];

  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const filePath = databaseUrl.replace(/^file:/, '');

  if (!isAbsolute(filePath) && !filePath.startsWith('./') && !filePath.startsWith('../')) {
    throw new Error('DATABASE_URL must be an absolute path or relative path starting with ./ or ../');
  }

  const absolutePath = isAbsolute(filePath) ? filePath : resolve(rootDir, filePath);

  if (!existsSync(absolutePath)) {
    throw new Error(`Database file does not exist at: ${absolutePath}`);
  };

  const connectionString = `file:${absolutePath}`;

  const adapter = new PrismaBetterSqlite3({ url: connectionString });
  return new PrismaClient({ adapter });
};

export const prisma = new Proxy({} as PrismaClient, {
  get<K extends keyof PrismaClient>(_target: PrismaClient, prop: K): PrismaClient[K] {
    if (!prismaInstance) {
      prismaInstance = createPrismaClient();
    }
    return prismaInstance[prop];
  }
} as ProxyHandler<PrismaClient>);