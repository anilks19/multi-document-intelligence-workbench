import { readFile } from "node:fs/promises";
import path from "node:path";
import { AppError } from "../middleware/errorHandler.js";

/**
 * Reads a TXT file from disk as UTF-8 and returns its contents.
 *
 * @param filePath Absolute or relative path to a .txt file
 * @returns File contents (trimmed)
 * @throws {AppError} When the file cannot be read
 */
export async function extractTxtText(filePath: string): Promise<string> {
  try {
    const content = await readFile(filePath, { encoding: "utf-8" });
    return content.trim();
  } catch (err) {
    if (err instanceof AppError) {
      throw err;
    }

    const detail = err instanceof Error ? err.message : "Unknown read error";
    const label = path.basename(filePath);
    throw new AppError(
      `Failed to extract text from TXT "${label}": ${detail}`,
      422,
    );
  }
}
