/**
 * Domain types for document upload, processing, and persistence.
 * Keep these free of Express/Multer so services stay framework-agnostic.
 */

/** Supported document kinds after type detection. */
export type SupportedFileType = "pdf" | "txt";

/**
 * Minimal upload descriptor passed into the processor.
 * Mapped from Multer (or any other source) at the route layer.
 */
export type UploadedFileInput = {
  /** Absolute path to the temporary file on disk */
  filePath: string;
  /** Original client filename (preserved for citations / UI) */
  originalName: string;
  /** Optional MIME type hint from the client */
  mimeType?: string;
};

/**
 * One processed document — a single file stays one object (document boundary).
 */
export type ProcessedDocument = {
  fileName: string;
  fileType: SupportedFileType;
  content: string;
};

/** Alias used by the analyze pipeline (parsed = extracted text + metadata). */
export type ParsedDocument = ProcessedDocument;

/** Row shape stored in SQLite `documents`. */
export type DocumentRecord = {
  id: string;
  fileName: string;
  fileType: string;
  content: string;
  createdAt: string;
};

/** Payload used when inserting into SQLite. */
export type CreateDocumentInput = {
  fileName: string;
  fileType: string;
  content: string;
};
