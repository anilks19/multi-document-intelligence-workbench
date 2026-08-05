/**
 * SQLite schema for the Multi-Document Intelligence Workbench.
 *
 * documents: one row per uploaded file, with extracted text ready for Gemini queries.
 */
export const DOCUMENTS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    fileName TEXT NOT NULL,
    fileType TEXT NOT NULL,
    content TEXT NOT NULL,
    createdAt TEXT NOT NULL
  );
`;

/** Speeds up listing documents by newest first. */
export const DOCUMENTS_CREATED_AT_INDEX_SQL = `
  CREATE INDEX IF NOT EXISTS idx_documents_createdAt
  ON documents (createdAt DESC);
`;
