/** Document payload sent to Gemini (content only — no file paths). */
export type AnalysisDocumentInput = {
  fileName: string;
  content: string;
};

/** Structured multi-document analysis — always JSON, never plain text. */
export type DocumentAnalysisResult = {
  summary: string;
  comparison: string[];
  discrepancies: string[];
  missingInformation: string[];
};
