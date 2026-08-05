import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env"), quiet: true });

const DEFAULT_PORT = 3001;
const DEFAULT_MAX_FILE_SIZE_MB = 5;
const DEFAULT_MAX_PROMPT_LENGTH = 4_000;

function getEnv(key: string): string | undefined {
  const value = process.env[key];
  if (value === undefined || value.trim() === "") {
    return undefined;
  }

  let normalized = value.trim();
  if (
    (normalized.startsWith("'") && normalized.endsWith("'")) ||
    (normalized.startsWith('"') && normalized.endsWith('"'))
  ) {
    normalized = normalized.slice(1, -1).trim();
  }

  return normalized === "" ? undefined : normalized;
}

function getRequiredEnv(key: string): string {
  const value = getEnv(key);
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}. Set it in server/.env`,
    );
  }
  return value;
}

function getPort(): number {
  const raw = getEnv("PORT");
  if (!raw) {
    return DEFAULT_PORT;
  }

  const port = Number(raw);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(
      `Invalid PORT value. Expected an integer between 1 and 65535.`,
    );
  }

  return port;
}

function getPositiveInt(key: string, fallback: number): number {
  const raw = getEnv(key);
  if (!raw) {
    return fallback;
  }

  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`Invalid ${key}. Expected a positive integer.`);
  }

  return value;
}

export type AppConfig = {
  port: number;
  /** Present only in memory — never log or return this value. */
  geminiApiKey: string | undefined;
  uploadsDir: string;
  dataDir: string;
  dbPath: string;
  isProduction: boolean;
  maxFileSizeMb: number;
  maxFileSizeBytes: number;
  maxPromptLength: number;
  /** `true` = reflect any origin (dev). Otherwise a concrete origin string. */
  corsOrigin: string | true;
};

const maxFileSizeMb = getPositiveInt("MAX_FILE_SIZE_MB", DEFAULT_MAX_FILE_SIZE_MB);
const corsOriginEnv = getEnv("CORS_ORIGIN");

/**
 * Typed, validated access to environment variables.
 * Secrets are never logged from this module.
 */
export const config: AppConfig = {
  port: getPort(),
  geminiApiKey: getEnv("GEMINI_API_KEY"),
  uploadsDir: path.resolve(__dirname, "../uploads"),
  dataDir: path.resolve(__dirname, "../data"),
  dbPath: path.resolve(__dirname, "../data/workbench.db"),
  isProduction: process.env.NODE_ENV === "production",
  maxFileSizeMb,
  maxFileSizeBytes: maxFileSizeMb * 1024 * 1024,
  maxPromptLength: getPositiveInt("MAX_PROMPT_LENGTH", DEFAULT_MAX_PROMPT_LENGTH),
  corsOrigin: corsOriginEnv && corsOriginEnv !== "*" ? corsOriginEnv : true,
};

/** Call before Gemini API usage — fails fast if the key is missing. */
export function getGeminiApiKey(): string {
  return getRequiredEnv("GEMINI_API_KEY");
}

/** True when a non-empty Gemini key is configured (does not expose the value). */
export function hasGeminiApiKey(): boolean {
  return Boolean(config.geminiApiKey);
}
