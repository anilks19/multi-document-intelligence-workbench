import { AppError } from "../middleware/errorHandler.js";
import type { AnalysisDocumentInput } from "../types/analysis.js";

/**
 * Renders one document as a clearly bounded block.
 * Documents are never concatenated into anonymous prose.
 */
function formatDocumentBlock(
  document: AnalysisDocumentInput,
  index: number,
): string {
  const ordinal = index + 1;
  const fileName = document.fileName.trim() || `document-${ordinal}`;

  return [
    `<document index="${ordinal}" fileName="${fileName}">`,
    document.content,
    `</document>`,
  ].join("\n");
}

/**
 * Builds the Gemini analysis prompt.
 *
 * Guarantees:
 * - Each document stays in its own labeled block with filename
 * - Instructs per-document analysis, comparison, discrepancies, and gaps
 * - Demands JSON-only output (no plain text)
 */
export function buildAnalysisPrompt(
  documents: AnalysisDocumentInput[],
  userPrompt: string,
): string {
  if (documents.length === 0) {
    throw new AppError("At least one document is required to build a prompt.", 400);
  }

  const trimmedPrompt = userPrompt.trim();
  if (!trimmedPrompt) {
    throw new AppError("userPrompt must not be empty.", 400);
  }

  const documentSection = documents
    .map((doc, index) => formatDocumentBlock(doc, index))
    .join("\n\n");

  return [
    "You are a multi-document intelligence analyst.",
    "",
    "## Instructions",
    "1. Treat each <document> block as a separate source. Do NOT merge them into one anonymous text blob.",
    "2. Always refer to documents by their fileName attribute.",
    "3. Analyze each document individually first (key facts, entities, dates, amounts).",
    "4. Then compare the documents against each other.",
    "5. Identify discrepancies (conflicting values or statements across documents).",
    "6. Identify missing information (present in some documents but absent in others).",
    "7. Return JSON ONLY — no markdown, no commentary, no plain-text prose outside JSON.",
    "",
    "## Required JSON shape",
    "{",
    '  "summary": string,',
    '  "comparison": string[],',
    '  "discrepancies": string[],',
    '  "missingInformation": string[]',
    "}",
    "",
    "## User request",
    trimmedPrompt,
    "",
    "## Documents",
    documentSection,
  ].join("\n");
}
