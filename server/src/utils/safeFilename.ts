import path from "node:path";

const MAX_ORIGINAL_NAME_LENGTH = 180;

/**
 * Produces a safe display/storage filename from an untrusted client name.
 * - Strips directories / traversal (.., /, \)
 * - Removes control + reserved characters
 * - Preserves a single final extension when allowed
 */
export function sanitizeOriginalFileName(
  originalName: string,
  allowedExtensions: ReadonlySet<string> = new Set([".pdf", ".txt"]),
): string {
  const base = path.basename(originalName.replace(/\\/g, "/")).normalize("NFKC");

  const cleaned = base
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/[<>:"|?*]/g, "_")
    .replace(/\s+/g, " ")
    .trim();

  const fallback = "upload.bin";
  if (!cleaned || cleaned === "." || cleaned === "..") {
    return fallback;
  }

  // Collapse accidental double extensions like "invoice.pdf.exe"
  const ext = path.extname(cleaned).toLowerCase();
  const nameWithoutExt = cleaned.slice(0, cleaned.length - ext.length) || "upload";

  const safeStem = nameWithoutExt
    .replace(/^\.+/, "")
    .replace(/\.{2,}/g, ".")
    .slice(0, MAX_ORIGINAL_NAME_LENGTH);

  if (!allowedExtensions.has(ext)) {
    return `${safeStem || "upload"}.bin`;
  }

  return `${safeStem || "upload"}${ext}`;
}

/** Ensures a resolved path stays inside an allowed root directory. */
export function isPathInsideRoot(filePath: string, rootDir: string): boolean {
  const resolvedFile = path.resolve(filePath);
  const resolvedRoot = path.resolve(rootDir);
  return (
    resolvedFile === resolvedRoot ||
    resolvedFile.startsWith(resolvedRoot + path.sep)
  );
}
