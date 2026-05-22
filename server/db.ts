import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../shared/schema";
import path from "path";
import { fileURLToPath } from "url";

// Works in both ESM (import.meta.url defined) and CJS bundles (use process.cwd())
const _dirname: string =
  typeof import.meta?.url === "string"
    ? path.dirname(fileURLToPath(import.meta.url))
    : process.cwd();

// data.db lives at the project root (one level up from server/)
const dbPath = path.join(_dirname, "data.db");

const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite, { schema });
