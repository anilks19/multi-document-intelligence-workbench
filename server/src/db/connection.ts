import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { config } from "../config.js";
import {
  DOCUMENTS_CREATED_AT_INDEX_SQL,
  DOCUMENTS_TABLE_SQL,
} from "./schema.js";

let db: Database.Database | null = null;

/**
 * Returns a singleton SQLite connection.
 * Creates the data directory and applies schema on first call.
 */
export function getDb(): Database.Database {
  if (db) {
    return db;
  }

  fs.mkdirSync(path.dirname(config.dbPath), { recursive: true });

  db = new Database(config.dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  migrate(db);

  return db;
}

function migrate(database: Database.Database): void {
  database.exec(DOCUMENTS_TABLE_SQL);
  database.exec(DOCUMENTS_CREATED_AT_INDEX_SQL);
}

/** Closes the connection (useful for tests / graceful shutdown). */
export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}
