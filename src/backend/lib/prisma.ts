import "temporal-polyfill/full/global";
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import postgres from "@prisma/orm-postgres/runtime";
import contractJson from "../../../prisma/contract.json" with { type: "json" };

const temporalGlobal = globalThis as typeof globalThis & {
  Temporal: {
    Instant: {
      from(value: string): { epochMilliseconds: number };
    };
  };
};

dotenv.config({
  path: fileURLToPath(new URL("../../../.env", import.meta.url)),
});

const connectionString =
  process.env["TEST_DATABASE_URL"] || process.env["DATABASE_URL"];

if (!connectionString) {
  throw new Error("DATABASE_URL or TEST_DATABASE_URL must be set");
}

const db = postgres({
  contractJson,
  url: connectionString,
});

type WhereInput = Record<string, unknown>;
type OrderByInput =
  | Record<string, "asc" | "desc">
  | Array<Record<string, "asc" | "desc">>;
type QueryField = {
  eq(value: unknown): QueryNode;
  neq(value: unknown): QueryNode;
  lte(value: unknown): QueryNode;
  lt(value: unknown): QueryNode;
  gte(value: unknown): QueryNode;
  gt(value: unknown): QueryNode;
  in(value: unknown[]): QueryNode;
  notIn(value: unknown[]): QueryNode;
  isNotNull(): QueryNode;
  asc(): QueryOrder;
  desc(): QueryOrder;
};
type QueryFields = Record<string, QueryField>;
type QueryOrder = unknown;
type QueryNode = {
  where(predicate: (fields: QueryFields) => QueryNode | QueryField | QueryOrder): QueryNode;
  orderBy(orderBy: QueryOrder | QueryOrder[]): QueryNode;
  all(): Promise<unknown[]>;
  update(data: Record<string, unknown>): Promise<unknown>;
  delete(): Promise<unknown>;
};
type QueryModel = QueryNode & {
  create(data: Record<string, unknown>): Promise<unknown>;
  upsert(args: {
    create: Record<string, unknown>;
    update: Record<string, unknown>;
    conflictOn: WhereInput;
  }): Promise<unknown>;
};

function toTemporalInstant(value: unknown): unknown {
  if (value instanceof Date) {
    return temporalGlobal.Temporal.Instant.from(value.toISOString());
  }

  return value;
}

function fromTemporalInstant(value: unknown): unknown {
  if (
    value &&
    typeof value === "object" &&
    "epochMilliseconds" in value &&
    typeof (value as { epochMilliseconds: unknown }).epochMilliseconds === "number"
  ) {
    return new Date((value as { epochMilliseconds: number }).epochMilliseconds);
  }

  if (Array.isArray(value)) {
    return value.map(fromTemporalInstant);
  }

  if (value && typeof value === "object") {
    if (Object.getPrototypeOf(value) !== Object.prototype) {
      return value;
    }

    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, fromTemporalInstant(entry)])
    );
  }

  return value;
}

function normalizeData(data: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key, toTemporalInstant(value)])
  );
}

function normalizeResult<T>(value: T): T {
  return fromTemporalInstant(value) as T;
}

function applyWhere(query: QueryNode | QueryModel, where?: WhereInput) {
  if (!where) {
    return query;
  }

  for (const [key, value] of Object.entries(where)) {
    if (Array.isArray(value)) {
      query = query.where((fields: QueryFields) =>
        fields[key].in(value.map(toTemporalInstant))
      );
      continue;
    }

    if (value instanceof Date || typeof value !== "object" || value === null) {
      query = query.where((fields: QueryFields) =>
        fields[key].eq(toTemporalInstant(value))
      );
      continue;
    }

    for (const [operator, operand] of Object.entries(
      value as Record<string, unknown>
    )) {
      query = query.where((fields: QueryFields) => {
        const field = fields[key];
        const normalized = toTemporalInstant(operand);

        switch (operator) {
          case "not":
            return operand === null ? field.isNotNull() : field.neq(normalized);
          case "lte":
            return field.lte(normalized);
          case "lt":
            return field.lt(normalized);
          case "gte":
            return field.gte(normalized);
          case "gt":
            return field.gt(normalized);
          case "in":
            return field.in((operand as unknown[]).map(toTemporalInstant));
          case "notIn":
            return field.notIn((operand as unknown[]).map(toTemporalInstant));
          default:
            return field.eq(normalized);
        }
      });
    }
  }

  return query;
}

function buildOrderBy(orderBy?: OrderByInput) {
  if (!orderBy) {
    return undefined;
  }

  const buildDirective = (entry: Record<string, "asc" | "desc">) => {
    return (fields: QueryFields) => {
      const [field, direction] = Object.entries(entry)[0] as [
        string,
        "asc" | "desc",
      ];
      return direction === "asc" ? fields[field].asc() : fields[field].desc();
    };
  };

  if (Array.isArray(orderBy)) {
    return orderBy.map(buildDirective);
  }

  return buildDirective(orderBy);
}

function createModel(model: unknown) {
  const typedModel = model as QueryModel;

  return {
    findMany(
      args: { where?: WhereInput; orderBy?: OrderByInput; select?: unknown } = {}
    ) {
      let query = typedModel;
      query = applyWhere(query, args.where);
      const orderBy = buildOrderBy(args.orderBy);
      if (orderBy) {
        query = query.orderBy(orderBy as QueryOrder | QueryOrder[]);
      }
      return query.all().then(normalizeResult);
    },
    findUnique(args: { where: WhereInput }) {
      const query = applyWhere(typedModel, args.where);
      return query.all().then((rows: unknown[]) => normalizeResult(rows[0] ?? null));
    },
    findFirst(
      args: { where?: WhereInput; orderBy?: OrderByInput; select?: unknown } = {}
    ) {
      let query = typedModel;
      query = applyWhere(query, args.where);
      const orderBy = buildOrderBy(args.orderBy);
      if (orderBy) {
        query = query.orderBy(orderBy as QueryOrder | QueryOrder[]);
      }
      return query.all().then((rows: unknown[]) => normalizeResult(rows[0] ?? null));
    },
    create(args: { data: Record<string, unknown> }) {
      return typedModel.create(normalizeData(args.data)).then(normalizeResult);
    },
    update(args: { where: WhereInput; data: Record<string, unknown> }) {
      return applyWhere(typedModel, args.where)
        .update(normalizeData(args.data))
        .then(normalizeResult);
    },
    delete(args: { where: WhereInput }) {
      return applyWhere(typedModel, args.where).delete().then(normalizeResult);
    },
    count(args: { where?: WhereInput } = {}) {
      let query = typedModel;
      query = applyWhere(query, args.where);
      return query.all().then((rows: unknown[]) => rows.length);
    },
    upsert(args: {
      where: WhereInput;
      update: Record<string, unknown>;
      create: Record<string, unknown>;
    }) {
      return typedModel.upsert({
        create: normalizeData(args.create),
        update: normalizeData(args.update),
        conflictOn: args.where,
      }).then(normalizeResult);
    },
  };
}

const publicDb = db.orm["public"] as Record<string, QueryModel>;

export const prisma = {
  user: createModel(publicDb["User"]),
  post: createModel(publicDb["Post"]),
  tip: createModel(publicDb["Tip"]),
  video: createModel(publicDb["Video"]),
  analytic: createModel(publicDb["Analytic"]),
  $disconnect: () => db.close(),
};
