import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import postgres from "@prisma/orm-postgres/runtime";
import { contractFromJson } from "@prisma/orm-postgres/static";
import type { Contract } from "../../../prisma/contract.d.js";
import contractJson from "../../../prisma/contract.json" with { type: "json" };
import type {
  Analytic,
  Post,
  Tip,
  User,
  Video,
} from "../types/prisma.js";

dotenv.config({
  path: fileURLToPath(new URL("../../../.env", import.meta.url)),
});

const connectionString =
  process.env["TEST_DATABASE_URL"] || process.env["DATABASE_URL"];

if (!connectionString) {
  throw new Error("DATABASE_URL or TEST_DATABASE_URL must be set");
}

const db = postgres({
  contract: contractFromJson<Contract>(contractJson),
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

function applyWhere<T extends QueryNode>(query: T, where?: WhereInput): T {
  if (!where) {
    return query;
  }

  for (const [key, value] of Object.entries(where)) {
    if (Array.isArray(value)) {
      query = query.where((fields: QueryFields) =>
        fields[key]!.in(value)
      ) as T;
      continue;
    }

    if (value instanceof Date || typeof value !== "object" || value === null) {
      query = query.where((fields: QueryFields) =>
        fields[key]!.eq(value)
      ) as T;
      continue;
    }

    for (const [operator, operand] of Object.entries(
      value as Record<string, unknown>
    )) {
      query = query.where((fields: QueryFields) => {
        const field = fields[key]!;

        switch (operator) {
          case "not":
            return operand === null ? field.isNotNull() : field.neq(operand);
          case "lte":
            return field.lte(operand);
          case "lt":
            return field.lt(operand);
          case "gte":
            return field.gte(operand);
          case "gt":
            return field.gt(operand);
          case "in":
            return field.in(operand as unknown[]);
          case "notIn":
            return field.notIn(operand as unknown[]);
          default:
            return field.eq(operand);
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
      return query.all() as Promise<T[]>;
    },
    findUnique(args: { where: WhereInput }): Promise<T | null> {
      const query = applyWhere(typedModel, args.where);
      return query.all().then((rows) => (rows[0] as T | undefined) ?? null);
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
      return query.all().then((rows) => (rows[0] as T | undefined) ?? null);
    },
    create(args: { data: Record<string, unknown> }): Promise<T> {
      return typedModel
        .create(args.data) as Promise<T>;
    },
    update(args: { where: WhereInput; data: Record<string, unknown> }): Promise<T> {
      return applyWhere(typedModel, args.where)
        .update(args.data) as Promise<T>;
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
        create: args.create,
        update: args.update,
        conflictOn: args.where,
      }) as Promise<T>;
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
