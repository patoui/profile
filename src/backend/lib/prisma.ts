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
    const activeSpan = tracer.scope().active();
    const spanOptions: Parameters<typeof tracer.startSpan>[1] = {
      tags: {
        "prisma.rawquery": e.query,
        "prisma.duration_ms": e.duration,
      },
    };
    if (activeSpan) {
      spanOptions.childOf = activeSpan;
    }
    const span = tracer.startSpan(`prisma_raw_query`, spanOptions);
    span.finish();
  })
  .$extends({
    query: {
      async $allOperations({ operation, model, args, query }) {
        const activeSpan = tracer.scope().active();
        const spanOptions: Parameters<typeof tracer.startSpan>[1] = {
          tags: {
            "prisma.operation": operation,
            "prisma.model": model ?? 'unknown',
            "prisma.args": JSON.stringify(args),
          },
        };
        if (activeSpan) {
          spanOptions.childOf = activeSpan;
        }
        const span = tracer.startSpan(
          `prisma_query_${model?.toLowerCase() ?? 'unknown'}_${operation}`,
          spanOptions
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