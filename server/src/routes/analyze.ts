import fs from "node:fs/promises";
import { Router } from "express";
import { config } from "../config.js";
import { AppError } from "../middleware/errorHandler.js";
import {
  mapMulterError,
  uploadDocuments,
} from "../middleware/upload.js";
import { processDocuments } from "../services/documentProcessor.js";
import { documentService } from "../services/documentService.js";
import { analyzeDocuments } from "../services/geminiService.js";
import type { ParsedDocument } from "../types/document.js";
import { validateUploadedFiles } from "../utils/fileValidation.js";

export const analyzeRouter = Router();

async function cleanupTempFiles(files: Express.Multer.File[]): Promise<void> {
  await Promise.all(
    files.map(async (file) => {
      try {
        await fs.unlink(file.path);
      } catch {
        // Best-effort cleanup
      }
    }),
  );
}

/**
 * POST /api/analyze
 * multipart/form-data:
 *   - files: one or more PDF/TXT documents
 *   - prompt: user instruction for Gemini
 */
analyzeRouter.post("/api/analyze", (req, res, next) => {
  uploadDocuments(req, res, (err: unknown) => {
    void (async () => {
      const uploaded = (req.files as Express.Multer.File[] | undefined) ?? [];

      try {
        if (err) {
          throw mapMulterError(err);
        }

        if (uploaded.length === 0) {
          throw new AppError(
            'No files uploaded. Attach one or more PDF/TXT files using field name "files".',
            400,
          );
        }

        const promptRaw = req.body?.prompt;
        const prompt =
          typeof promptRaw === "string" ? promptRaw.trim() : "";

        if (!prompt) {
          throw new AppError(
            'Missing "prompt" field. Provide a user instruction as form field "prompt".',
            400,
          );
        }

        if (prompt.length > config.maxPromptLength) {
          throw new AppError(
            `Prompt too long. Maximum length is ${config.maxPromptLength} characters.`,
            400,
          );
        }

        // Hardened validation: path, MIME, size, magic bytes, safe names
        const validated = await validateUploadedFiles(uploaded);

        const parsedDocuments: ParsedDocument[] = await processDocuments(
          validated.map((file) => ({
            filePath: file.filePath,
            originalName: file.safeFileName,
            mimeType: file.mimeType,
          })),
        );

        const savedDocuments = parsedDocuments.map((doc) => {
          const record = documentService.create({
            fileName: doc.fileName,
            fileType: doc.fileType,
            content: doc.content,
          });

          return {
            id: record.id,
            fileName: record.fileName,
            fileType: record.fileType,
            createdAt: record.createdAt,
          };
        });

        const analysis = await analyzeDocuments(
          parsedDocuments.map((doc) => ({
            fileName: doc.fileName,
            content: doc.content,
          })),
          prompt,
        );

        res.status(200).json({
          documents: savedDocuments,
          analysis,
        });
      } catch (error) {
        next(error);
      } finally {
        await cleanupTempFiles(uploaded);
      }
    })();
  });
});
