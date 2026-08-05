import path from "node:path";
import { AppError } from "../middleware/errorHandler.js";
import type {
  ProcessedDocument,
  SupportedFileType,
  UploadedFileInput,
} from "../types/document.js";
import { extractPdfText } from "./pdfParser.js";
import { extractTxtText } from "./txtParser.js";

/**
 * Detects supported file type from filename (extension is authoritative).
 */
export function detectFileType(fileName: string): SupportedFileType {
  const ext = path.extname(fileName).toLowerCase();

  switch (ext) {
    case ".pdf":
      return "pdf";
    case ".txt":
      return "txt";
    default:
      throw new AppError(
        `Unsupported file type for "${fileName}". Only PDF and TXT are allowed.`,
        400,
      );
  }
}

async function extractContent(
  fileType: SupportedFileType,
  filePath: string,
): Promise<string> {
  switch (fileType) {
    case "pdf":
      return extractPdfText(filePath);
    case "txt":
      return extractTxtText(filePath);
    default: {
      const _exhaustive: never = fileType;
      throw new AppError(`Unhandled file type: ${String(_exhaustive)}`, 500);
    }
  }
}

/**
 * Processes one uploaded file into a structured document.
 * Filename and type are preserved; content is never merged across files.
 */
export async function processDocument(
  file: UploadedFileInput,
): Promise<ProcessedDocument> {
  const fileName = file.originalName;
  const fileType = detectFileType(fileName);
  const content = await extractContent(fileType, file.filePath);

  return {
    fileName,
    fileType,
    content,
  };
}

/**
 * Processes multiple uploads independently — each input maps to one output
 * entry so document boundaries stay intact for later Gemini context / citations.
 */
export async function processDocuments(
  files: UploadedFileInput[],
): Promise<ProcessedDocument[]> {
  if (files.length === 0) {
    throw new AppError("No files provided for processing.", 400);
  }

  const documents: ProcessedDocument[] = [];

  for (const file of files) {
    // Sequential: clearer errors per file; avoids flooding parsers
    documents.push(await processDocument(file));
  }

  return documents;
}
