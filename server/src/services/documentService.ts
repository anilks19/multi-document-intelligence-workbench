import { randomUUID } from "node:crypto";
import { getDb } from "../db/connection.js";
import type { CreateDocumentInput, DocumentRecord } from "../types/document.js";

/**
 * Reusable data-access layer for the documents table.
 * Routes/services call this — they never touch SQL directly.
 */
export const documentService = {
  create(input: CreateDocumentInput): DocumentRecord {
    const record: DocumentRecord = {
      id: randomUUID(),
      fileName: input.fileName,
      fileType: input.fileType,
      content: input.content,
      createdAt: new Date().toISOString(),
    };

    getDb()
      .prepare(
        `INSERT INTO documents (id, fileName, fileType, content, createdAt)
         VALUES (@id, @fileName, @fileType, @content, @createdAt)`,
      )
      .run(record);

    return record;
  },

  findById(id: string): DocumentRecord | null {
    const row = getDb()
      .prepare(
        `SELECT id, fileName, fileType, content, createdAt
         FROM documents
         WHERE id = ?`,
      )
      .get(id) as DocumentRecord | undefined;

    return row ?? null;
  },

  findAll(): DocumentRecord[] {
    return getDb()
      .prepare(
        `SELECT id, fileName, fileType, content, createdAt
         FROM documents
         ORDER BY createdAt DESC`,
      )
      .all() as DocumentRecord[];
  },

  /** Metadata only — avoids shipping full text to list endpoints. */
  findAllSummary(): Omit<DocumentRecord, "content">[] {
    return getDb()
      .prepare(
        `SELECT id, fileName, fileType, createdAt
         FROM documents
         ORDER BY createdAt DESC`,
      )
      .all() as Omit<DocumentRecord, "content">[];
  },

  deleteById(id: string): boolean {
    const result = getDb()
      .prepare(`DELETE FROM documents WHERE id = ?`)
      .run(id);

    return result.changes > 0;
  },
};
