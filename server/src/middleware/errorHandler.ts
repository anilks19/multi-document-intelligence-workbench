import type { NextFunction, Request, Response } from "express";
import { config } from "../config.js";

export class AppError extends Error {
  readonly statusCode: number;
  readonly isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.isOperational = isOperational;
  }
}

/** Strip secrets and absolute paths before sending errors to clients. */
export function sanitizeErrorMessage(message: string): string {
  let safe = message;

  const key = config.geminiApiKey;
  if (key && key.length > 8) {
    safe = safe.split(key).join("[REDACTED]");
  }

  // Redact common absolute path prefixes (Unix + Windows)
  safe = safe.replace(/(?:[A-Za-z]:)?(?:\/|\\)[^\s:'"]+/g, "[PATH]");

  // Redact anything that looks like a Google API key
  safe = safe.replace(/\bAIza[0-9A-Za-z\-_]{20,}\b/g, "[REDACTED]");
  safe = safe.replace(/\bAQ\.[0-9A-Za-z\-_]{20,}\b/g, "[REDACTED]");

  return safe;
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    error: "Not Found",
    message: "The requested resource does not exist.",
  });
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const isAppError = err instanceof AppError;
  const statusCode = isAppError ? err.statusCode : 500;
  const rawMessage =
    isAppError || err instanceof Error
      ? err.message
      : "An unexpected error occurred.";

  if (!isAppError || statusCode >= 500) {
    // Log full error server-side only — never include secrets in structured client payloads
    console.error("[error]", {
      statusCode,
      name: err instanceof Error ? err.name : "UnknownError",
      message: sanitizeErrorMessage(rawMessage),
    });
  }

  const clientMessage =
    statusCode >= 500 && config.isProduction
      ? "An unexpected error occurred."
      : sanitizeErrorMessage(rawMessage);

  res.status(statusCode).json({
    error: statusCode >= 500 ? "Internal Server Error" : "Request Error",
    message: clientMessage,
  });
}
