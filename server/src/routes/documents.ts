import fs from "node:fs/promises";
import { Router } from "express";
import { AppError } from "../middleware/errorHandler.js";
import {
  mapMulterError,
  uploadDocuments,
} from "../middleware/upload.js";
import { validateUploadedFiles } from "../utils/fileValidation.js";

export const documentsRouter = Router();

async function cleanupTempFiles(files: Express.Multer.File[]): Promise<void> {
  await Promise.all(
    files.map(async (file) => {
      try {
        await fs.unlink(file.path);
      } catch {
        // best-effort
      }
    }),
  );
}

/**
 * POST /api/documents
 * multipart/form-data, field name: "files" (one or more PDF/TXT)
 *
 * Validates uploads and returns safe metadata (no absolute paths).
 */
documentsRouter.post("/api/documents", (req, res, next) => {
  uploadDocuments(req, res, (err: unknown) => {
    void (async () => {
      const files = (req.files as Express.Multer.File[] | undefined) ?? [];

      try {
        if (err) {
          throw mapMulterError(err);
        }

        if (files.length === 0) {
          throw new AppError(
            'No files uploaded. Attach one or more PDF/TXT files using field name "files".',
            400,
          );
        }

        const validated = await validateUploadedFiles(files);

        res.status(201).json({
          message: "Files uploaded and validated successfully.",
          count: validated.length,
          files: validated.map((file, index) => ({
            originalName: file.safeFileName,
            storedName: files[index]?.filename,
            mimeType: file.mimeType,
            size: file.size,
          })),
        });
      } catch (error) {
        next(error);
      } finally {
        // Upload-only endpoint: keep disk clean after validation response
        await cleanupTempFiles(files);
      }
    })();
  });
});
