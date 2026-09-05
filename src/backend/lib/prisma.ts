import "temporal-polyfill/full/global";
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import postgres from "@prisma/orm-postgres/runtime";
import contractJson from "../../../prisma/contract.json" with { type: "json" };
import type {
  Analytic,
  Post,
  Tip,
  User,
  Video,
} from "../types/prisma.js";

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
  eq(value: unknown): unknown;
  neq(value: unknown): unknown;
  lte(value: unknown): unknown;
  lt(value: unknown): unknown;
  gte(value: unknown): unknown;
  gt(value: unknown): unknown;
  in(value: unknown[]): unknown;
  notIn(value: unknown[]): unknown;
  isNotNull(): unknown;
  asc(): unknown;
  desc(): unknown;
};
type QueryFields = Record<string, QueryField>;
type QueryNode = {
  where(predicate: (fields: QueryFields) => unknown): QueryNode;
  orderBy(orderBy: unknown): QueryNode;
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

function normalizeResult<T>(value: unknown): T {
  return fromTemporalInstant(value) as T;
}

function applyWhere<T extends QueryNode>(query: T, where?: WhereInput): T {
  if (!where) {
    return query;
  }

  for (const [key, value] of Object.entries(where)) {
    if (Array.isArray(value)) {
      query = query.where((fields: QueryFields) =>
        fields[key]!.in(value.map(toTemporalInstant))
      ) as T;
      continue;
    }

    if (value instanceof Date || typeof value !== "object" || value === null) {
      query = query.where((fields: QueryFields) =>
        fields[key]!.eq(toTemporalInstant(value))
      ) as T;
      continue;
    }

    for (const [operator, operand] of Object.entries(
      value as Record<string, unknown>
    )) {
      query = query.where((fields: QueryFields) => {
        const field = fields[key]!;
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
      }) as T;
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
      const [field, direction] = Object.entries(entry)[0]! as [
        string,
        "asc" | "desc",
      ];
      return direction === "asc" ? fields[field]!.asc() : fields[field]!.desc();
    };
  };

  if (Array.isArray(orderBy)) {
    return orderBy.map(buildDirective);
  }

  return buildDirective(orderBy);
}

type ModelClient<T> = {
  findMany(args?: {
    where?: WhereInput;
    orderBy?: OrderByInput;
    select?: unknown;
  }): Promise<T[]>;
  findUnique(args: { where: WhereInput }): Promise<T | null>;
  findFirst(args?: {
    where?: WhereInput;
    orderBy?: OrderByInput;
    select?: unknown;
  }): Promise<T | null>;
  create(args: { data: Record<string, unknown> }): Promise<T>;
  update(args: { where: WhereInput; data: Record<string, unknown> }): Promise<T>;
  delete(args: { where: WhereInput }): Promise<void>;
  count(args?: { where?: WhereInput }): Promise<number>;
  upsert(args: {
    where: WhereInput;
    update: Record<string, unknown>;
    create: Record<string, unknown>;
  }): Promise<T>;
};

function createModel<T>(model: unknown): ModelClient<T> {
  const typedModel = model as QueryModel;

  return {
    findMany(
      args: { where?: WhereInput; orderBy?: OrderByInput; select?: unknown } = {}
    ): Promise<T[]> {
      let query = typedModel;
      query = applyWhere(query, args.where);
      const orderBy = buildOrderBy(args.orderBy);
      if (orderBy) {
        query = query.orderBy(orderBy as unknown) as QueryModel;
      }
      return query.all().then((rows) => normalizeResult(rows) as T[]);
    },
    findUnique(args: { where: WhereInput }): Promise<T | null> {
      const query = applyWhere(typedModel, args.where);
      return query.all().then((rows) => normalizeResult<T | null>(rows[0] ?? null));
    },
    findFirst(
      args: { where?: WhereInput; orderBy?: OrderByInput; select?: unknown } = {}
    ): Promise<T | null> {
      let query = typedModel;
      query = applyWhere(query, args.where);
      const orderBy = buildOrderBy(args.orderBy);
      if (orderBy) {
        query = query.orderBy(orderBy as unknown) as QueryModel;
      }
      return query.all().then((rows) => normalizeResult<T | null>(rows[0] ?? null));
    },
    create(args: { data: Record<string, unknown> }): Promise<T> {
      return typedModel
        .create(normalizeData(args.data))
        .then((result) => normalizeResult<T>(result));
    },
    update(args: { where: WhereInput; data: Record<string, unknown> }): Promise<T> {
      return applyWhere(typedModel, args.where)
        .update(normalizeData(args.data))
        .then((result) => normalizeResult<T>(result));
    },
    delete(args: { where: WhereInput }): Promise<void> {
      return applyWhere(typedModel, args.where).delete().then(() => undefined);
    },
    count(args: { where?: WhereInput } = {}): Promise<number> {
      let query = typedModel;
      query = applyWhere(query, args.where);
      return query.all().then((rows) => rows.length);
    },
    upsert(args: {
      where: WhereInput;
      update: Record<string, unknown>;
      create: Record<string, unknown>;
    }): Promise<T> {
      return typedModel.upsert({
        create: normalizeData(args.create),
        update: normalizeData(args.update),
        conflictOn: args.where,
      }).then((result) => normalizeResult<T>(result));
    },
  };
}

const publicDb = db.orm["public"] as unknown as Record<string, QueryModel>;

export const prisma = {
  user: createModel<User>(publicDb["User"]),
  post: createModel<Post>(publicDb["Post"]),
  tip: createModel<Tip>(publicDb["Tip"]),
  video: createModel<Video>(publicDb["Video"]),
  analytic: createModel<Analytic>(publicDb["Analytic"]),
  $disconnect: () => db.close(),
};
