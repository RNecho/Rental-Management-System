import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "@shared/schema";

const dbUrl = process.env.DATABASE_URL || "file:sqlite.db";
export const client = createClient({ url: dbUrl });
export const db = drizzle(client, { schema });
