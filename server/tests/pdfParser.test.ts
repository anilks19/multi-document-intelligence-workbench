import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { AppError } from "../src/middleware/errorHandler.js";
import { extractPdfText } from "../src/services/pdfParser.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const applicationPdf = path.resolve(
  __dirname,
  "../../samples/application.pdf",
);

describe("extractPdfText", () => {
  it("extracts synthetic application fields from samples/application.pdf", async () => {
    const text = await extractPdfText(applicationPdf);

    expect(text.length).toBeGreaterThan(0);

    // Validates real PDF → text pipeline (not a mocked parser)
    expect(text).toContain("NovaPeak Analytics LLC");
    expect(text).toContain("USD 12,500,000");
    expect(text).toContain("88 Harbor Lane");
    expect(text).toContain("SYN-APP-1001");
  });

  it("throws AppError when the PDF path does not exist", async () => {
    const missing = path.resolve(__dirname, "../../samples/does-not-exist.pdf");

    await expect(extractPdfText(missing)).rejects.toBeInstanceOf(AppError);
  });
});
