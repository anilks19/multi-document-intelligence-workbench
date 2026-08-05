import axios, { AxiosError } from "axios";
import type { AnalyzeResponse } from "../types/analysis";

/**
 * Axios client for the Multi Document Intelligence Workbench API.
 * In Vite dev, empty baseURL routes through the proxy to http://localhost:3001.
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "",
  timeout: 120_000,
});

type ApiErrorBody = {
  error?: string;
  message?: string;
};

/**
 * POST /api/analyze
 * Sends multipart/form-data with:
 *   - files: one or more PDF/TXT File objects
 *   - prompt: user instruction string
 */
export async function analyzeDocuments(
  files: File[],
  prompt: string,
): Promise<AnalyzeResponse> {
  const formData = new FormData();

  for (const file of files) {
    formData.append("files", file);
  }

  formData.append("prompt", prompt);

  const { data } = await api.post<AnalyzeResponse>("/api/analyze", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return data;
}

/** Maps Axios / network failures into a user-facing message. */
export function getApiErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const axiosError = err as AxiosError<ApiErrorBody>;
    return (
      axiosError.response?.data?.message ??
      axiosError.message ??
      "Request failed. Please try again."
    );
  }

  if (err instanceof Error) {
    return err.message;
  }

  return "Analysis failed. Please try again.";
}
