import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import multer, { MulterError } from "multer";
import type { Request } from "express";
import { config } from "../config.js";
import { sanitizeOriginalFileName } from "../utils/safeFilename.js";
import { AppError } from "./errorHandler.js";

/** Max files in a single upload request. */
export const MAX_FILES_PER_REQUEST = 10;

const ALLOWED_EXTENSIONS = new Set([".pdf", ".txt"]);

export function ensureUploadsDir(): void {
  fs.mkdirSync(config.uploadsDir, { recursive: true });
}

function getExtension(originalName: string): string {
  return path.extname(originalName).toLowerCase();
}

function isAllowedExtension(originalName: string): boolean {
  return ALLOWED_EXTENSIONS.has(getExtension(originalName));
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    try {
      ensureUploadsDir();
      cb(null, config.uploadsDir);
    } catch (err) {
      cb(err as Error, config.uploadsDir);
    }
  },
  filename: (_req, file, cb) => {
    // Never trust client filenames on disk — UUID only + validated extension
    const safeName = sanitizeOriginalFileName(file.originalname, ALLOWED_EXTENSIONS);
    const ext = getExtension(safeName);
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      cb(new AppError("Invalid file extension after sanitization.", 400), "");
      return;
    }
    cb(null, `${randomUUID()}${ext}`);
  },
});

function fileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
): void {
  const basename = path.basename(file.originalname.replace(/\\/g, "/"));

  if (basename.includes("\0") || file.originalname.includes("..")) {
    cb(new AppError("Invalid file name.", 400));
    return;
  }

  if (!isAllowedExtension(basename)) {
    cb(
      new AppError(
        `Invalid file "${basename}". Only .pdf and .txt files are allowed.`,
        400,
      ),
    );
    return;
  }

  cb(null, true);
}

/**
 * Multer middleware: multiple PDF/TXT files → server/uploads/
 * Form field name must be "files".
 */
export const uploadDocuments = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.maxFileSizeBytes,
    files: MAX_FILES_PER_REQUEST,
    fields: 5,
    fieldSize: config.maxPromptLength * 2,
  },
}).array("files", MAX_FILES_PER_REQUEST);

/** Maps Multer errors to clear client-facing AppErrors. */
export function mapMulterError(err: unknown): unknown {
  if (!(err instanceof MulterError)) {
    return err;
  }

  switch (err.code) {
    case "LIMIT_FILE_SIZE":
      return new AppError(
        `File too large. Maximum size is ${config.maxFileSizeMb} MB per file.`,
        400,
      );
    case "LIMIT_FILE_COUNT":
      return new AppError(
        `Too many files. Maximum is ${MAX_FILES_PER_REQUEST} files per request.`,
        400,
      );
    case "LIMIT_UNEXPECTED_FILE":
      return new AppError(
        'Unexpected field. Upload files using the form field name "files".',
        400,
      );
    case "LIMIT_FIELD_VALUE":
      return new AppError(
        `Prompt too long. Maximum length is ${config.maxPromptLength} characters.`,
        400,
      );
    default:
      return new AppError("Upload failed due to invalid multipart payload.", 400);
  }
}
