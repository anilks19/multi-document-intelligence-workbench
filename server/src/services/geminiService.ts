import { GoogleGenAI, Type } from "@google/genai";
import { getGeminiApiKey } from "../config.js";
import { AppError, sanitizeErrorMessage } from "../middleware/errorHandler.js";
import type {
  AnalysisDocumentInput,
  DocumentAnalysisResult,
} from "../types/analysis.js";
import { buildAnalysisPrompt } from "./promptBuilder.js";

const GEMINI_MODEL = "gemini-flash-latest";

const ANALYSIS_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: "Concise overall summary across all documents.",
    },
    comparison: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Side-by-side comparison points between documents.",
    },
    discrepancies: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Conflicts or inconsistent values found across documents.",
    },
    missingInformation: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Information present in some documents but missing in others.",
    },
  },
  required: ["summary", "comparison", "discrepancies", "missingInformation"],
} as const;

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function parseAnalysisResult(raw: string): DocumentAnalysisResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    throw new AppError(
      "Gemini returned invalid JSON. Expected a structured analysis object.",
      502,
    );
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    typeof (parsed as DocumentAnalysisResult).summary !== "string" ||
    !isStringArray((parsed as DocumentAnalysisResult).comparison) ||
    !isStringArray((parsed as DocumentAnalysisResult).discrepancies) ||
    !isStringArray((parsed as DocumentAnalysisResult).missingInformation)
  ) {
    throw new AppError(
      "Gemini response JSON did not match the expected analysis shape.",
      502,
    );
  }

  const result = parsed as DocumentAnalysisResult;

  return {
    summary: result.summary,
    comparison: result.comparison,
    discrepancies: result.discrepancies,
    missingInformation: result.missingInformation,
  };
}

function mapGeminiError(err: unknown): AppError {
  if (err instanceof AppError) {
    return err;
  }

  const message = err instanceof Error ? err.message : "Unknown Gemini API error";
  const lower = message.toLowerCase();

  if (lower.includes("api key") || lower.includes("permission") || lower.includes("401")) {
    return new AppError(
      "Gemini authentication failed. Check GEMINI_API_KEY in server/.env.",
      401,
    );
  }

  if (lower.includes("429") || lower.includes("quota") || lower.includes("rate")) {
    return new AppError("Gemini rate limit or quota exceeded. Try again later.", 429);
  }

  return new AppError(
    `Gemini API request failed: ${sanitizeErrorMessage(message)}`,
    502,
  );
}

/**
 * Analyzes multiple documents with Gemini and returns structured JSON only.
 */
export async function analyzeDocuments(
  documents: AnalysisDocumentInput[],
  userPrompt: string,
): Promise<DocumentAnalysisResult> {
  if (documents.length === 0) {
    throw new AppError("At least one document is required for analysis.", 400);
  }

  if (!userPrompt.trim()) {
    throw new AppError("userPrompt must not be empty.", 400);
  }

  let apiKey: string;
  try {
    apiKey = getGeminiApiKey();
  } catch {
    throw new AppError(
      "GEMINI_API_KEY is not configured. Set it in server/.env.",
      500,
    );
  }

  const ai = new GoogleGenAI({ apiKey });
  const prompt = buildAnalysisPrompt(documents, userPrompt);

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: ANALYSIS_RESPONSE_SCHEMA,
      },
    });

    const text = response.text?.trim();
    if (!text) {
      throw new AppError("Gemini returned an empty response.", 502);
    }

    return parseAnalysisResult(text);
  } catch (err) {
    throw mapGeminiError(err);
  }
}
