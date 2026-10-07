import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

const g = globalThis as unknown as { __sql?: ReturnType<typeof postgres> };
// prepare:false is required for Supabase's transaction pooler.
const sql = g.__sql ?? postgres(process.env.DATABASE_URL ?? "", { prepare: false, max: 5 });
if (process.env.NODE_ENV !== "production") g.__sql = sql;

export const db = drizzle(sql, { schema });
export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
