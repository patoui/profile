import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma/client.js";
import tracer from "../tracer.js";

const connectionString = `${process.env['DATABASE_URL']}`;

const adapter = new PrismaBetterSqlite3({ url: connectionString });

const prisma = new PrismaClient({
  adapter,
  log: [{ emit: "event", level: "query" }],
})
  .$on("query", (e) => {
    const span = tracer.startSpan(`prisma_raw_query`, {
      childOf: tracer.scope().active() || undefined,
      tags: {
        "prisma.rawquery": e.query,
        "prisma.duration_ms": e.duration,
      },
    });
    span.finish();
  })
  .$extends({
    query: {
      async $allOperations({ operation, model, args, query }) {
        const span = tracer.startSpan(
          `prisma_query_${model?.toLowerCase() ?? 'unknown'}_${operation}`,
          {
            tags: {
              "prisma.operation": operation,
              "prisma.model": model ?? 'unknown',
              "prisma.args": JSON.stringify(args),
            },
            childOf: tracer.scope().active() || undefined,
          }
        );
        try {
          const result = await query(args);
          span.finish();
          return result;
        } catch (error) {
          span.setTag("error", error);
          span.finish();
          throw error;
        }
      },
    },
  });

export { prisma };