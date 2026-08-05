import { readFile } from "node:fs/promises";
import path from "node:path";
import { config } from "../config.js";
import { AppError } from "../middleware/errorHandler.js";
import { isPathInsideRoot, sanitizeOriginalFileName } from "./safeFilename.js";

const ALLOWED_EXTENSIONS = new Set([".pdf", ".txt"]);

const ALLOWED_MIME_BY_EXT: Record<string, ReadonlySet<string>> = {
  ".pdf": new Set(["application/pdf", "application/octet-stream"]),
  ".txt": new Set([
    "text/plain",
    "text/csv",
    "application/octet-stream",
    "application/txt",
  ]),
};

export type ValidatedUpload = {
  filePath: string;
  /** Sanitized original name safe for DB / prompts / UI */
  safeFileName: string;
  mimeType: string;
  size: number;
};

function assertPdfMagic(buffer: Buffer, label: string): void {
  // PDF files must start with "%PDF"
  if (buffer.length < 5 || buffer.subarray(0, 4).toString("utf8") !== "%PDF") {
    throw new AppError(
      `File "${label}" failed content validation. Expected a valid PDF.`,
      400,
    );
  }
}

function assertTxtLooksTextual(buffer: Buffer, label: string): void {
  // Reject obvious binaries pretending to be .txt (NUL bytes are a strong signal)
  if (buffer.includes(0)) {
    throw new AppError(
      `File "${label}" failed content validation. TXT uploads must be plain text.`,
      400,
    );
  }
}

/**
 * Post-upload validation: path confinement, extension/MIME, size, magic bytes.
 * Call after Multer writes the temp file.
 */
export async function validateUploadedFile(
  file: Express.Multer.File,
): Promise<ValidatedUpload> {
  if (!isPathInsideRoot(file.path, config.uploadsDir)) {
    throw new AppError("Upload path is outside the allowed uploads directory.", 400);
  }

  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    throw new AppError(
      `Invalid file type for "${file.originalname}". Only PDF and TXT are allowed.`,
      400,
    );
  }

  // Disk filename from Multer must be UUID + allowed ext (no client-controlled path)
  const storedExt = path.extname(file.filename).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(storedExt) || file.filename.includes("..")) {
    throw new AppError("Stored upload filename failed safety checks.", 400);
  }

  if (file.size <= 0) {
    throw new AppError(`File "${file.originalname}" is empty.`, 400);
  }

  if (file.size > config.maxFileSizeBytes) {
    throw new AppError(
      `File "${file.originalname}" exceeds the ${config.maxFileSizeMb} MB limit.`,
      400,
    );
  }

  const allowedMimes = ALLOWED_MIME_BY_EXT[ext];
  const mime = (file.mimetype || "application/octet-stream").toLowerCase();
  if (allowedMimes && !allowedMimes.has(mime)) {
    throw new AppError(
      `File "${file.originalname}" has disallowed MIME type "${file.mimetype}".`,
      400,
    );
  }

  const header = await readFile(file.path);

  if (ext === ".pdf") {
    assertPdfMagic(header, file.originalname);
  } else if (ext === ".txt") {
    assertTxtLooksTextual(header, file.originalname);
  }

  return {
    filePath: file.path,
    safeFileName: sanitizeOriginalFileName(file.originalname, ALLOWED_EXTENSIONS),
    mimeType: mime,
    size: file.size,
  };
}

export async function validateUploadedFiles(
  files: Express.Multer.File[],
): Promise<ValidatedUpload[]> {
  const validated: ValidatedUpload[] = [];
  for (const file of files) {
    validated.push(await validateUploadedFile(file));
  }
  return validated;
}
