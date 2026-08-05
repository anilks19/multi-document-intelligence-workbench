import cors from "cors";
import express from "express";
import { config } from "./config.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { ensureUploadsDir } from "./middleware/upload.js";
import { analyzeRouter } from "./routes/analyze.js";
import { documentsRouter } from "./routes/documents.js";
import { healthRouter } from "./routes/health.js";

export function createApp() {
  ensureUploadsDir();

  const app = express();

  // Hide Express fingerprint
  app.disable("x-powered-by");

  app.use(
    cors({
      origin: config.corsOrigin,
      methods: ["GET", "POST", "OPTIONS"],
    }),
  );

  // Bound JSON bodies (analyze uses multipart; this protects other routes)
  app.use(express.json({ limit: "100kb" }));
  app.use(express.urlencoded({ extended: true, limit: "100kb" }));

  app.use(healthRouter);
  app.use(documentsRouter);
  app.use(analyzeRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
