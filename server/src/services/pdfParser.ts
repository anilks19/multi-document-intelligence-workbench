import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFParse } from "pdf-parse";
import { AppError } from "../middleware/errorHandler.js";

/**
 * Reads a PDF from disk and returns its extracted plain text.
 *
 * @param filePath Absolute or relative path to a PDF file
 * @returns Extracted text (trimmed). Empty string if the PDF has no extractable text.
 * @throws {AppError} When the file cannot be read or parsing fails
 */
export async function extractPdfText(filePath: string): Promise<string> {
  let parser: PDFParse | null = null;

  try {
    const buffer = await readFile(filePath);
    const data = new Uint8Array(buffer);

    parser = new PDFParse({ data });
    const result = await parser.getText();

    return (result.text ?? "").trim();
  } catch (err) {
    if (err instanceof AppError) {
      throw err;
    }

    const detail = err instanceof Error ? err.message : "Unknown parse error";
    const label = path.basename(filePath);
    throw new AppError(
      `Failed to extract text from PDF "${label}": ${detail}`,
      422,
    );
  } finally {
    if (parser) {
      await parser.destroy().catch(() => {
        // Ignore cleanup failures — parsing already succeeded or failed
      });
    }
  }
}
