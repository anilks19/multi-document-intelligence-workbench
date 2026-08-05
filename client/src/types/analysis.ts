export interface AnalyzeDocumentMeta {
  id: string;
  fileName: string;
  fileType: string;
  createdAt: string;
}

/** Structured analysis payload returned by POST /api/analyze */
export interface DocumentAnalysis {
  summary: string;
  comparison: string[];
  discrepancies: string[];
  missingInformation: string[];
}

export interface AnalyzeResponse {
  documents: AnalyzeDocumentMeta[];
  analysis: DocumentAnalysis;
}

export interface SummaryProps {
  summary: string;
}

export interface ComparisonTableProps {
  comparison: string[];
}

export interface DiscrepanciesProps {
  discrepancies: string[];
}

export interface MissingInformationProps {
  missingInformation: string[];
}

export interface AnalysisResultsProps {
  analysis: DocumentAnalysis;
}
