# Server — Multi-Document Intelligence Workbench API

Express + TypeScript backend for document upload, parsing, SQLite persistence, and Gemini analysis.

For the full project overview, architecture, and interview notes, see the **[root README](../README.md)**.

## Quick start

```bash
nvm use 20
cp .env.example .env   # set GEMINI_API_KEY
npm install
npm run dev            # http://localhost:3001
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start API with hot reload (`tsx watch`) |
| `npm run build` | Compile TypeScript → `dist/` |
| `npm start` | Run compiled `dist/index.js` |
| `npm test` | Vitest (PDF parser) |
| `npm run typecheck` | `tsc --noEmit` |

## Environment

See [`.env.example`](./.env.example):

- `GEMINI_API_KEY` (required for `/api/analyze`)
- `PORT` (default `3001`)
- Optional: `MAX_FILE_SIZE_MB`, `MAX_PROMPT_LENGTH`, `CORS_ORIGIN`

## Key endpoints

- `GET /health`
- `POST /api/documents` — multipart `files`
- `POST /api/analyze` — multipart `files` + `prompt`

## Layout

```text
src/
  routes/        HTTP adapters
  services/      parse, prompt, Gemini, DB access
  middleware/    upload + errors
  utils/         safe filenames + file validation
  db/            SQLite
  config.ts      typed env access
```
