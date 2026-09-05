import 'dotenv/config';
import { definePrismaConfig } from 'prisma/config';
import { defineConfig as ormConfig } from '@prisma/orm-postgres/config';

export default definePrismaConfig({
  orm: ormConfig({
    contract: '../../prisma/contract.prisma',
    db: {
      connection:
        process.env['DATABASE_URL'] ??
        'postgresql://profile:change-me@127.0.0.1:5432/profile',
    },
  }),
});
