# Multi-Document Intelligence Workbench

MVP for a technical screening: upload multiple PDF/TXT files, extract text, store metadata in SQLite, and run structured cross-document analysis with Google Gemini.

| App | Path | Stack |
|-----|------|--------|
| Backend | [`server/`](./server) | Node, Express, TypeScript, SQLite, `@google/genai` |
| Frontend | [`client/`](./client) | React, TypeScript, Vite, Axios |

**Quick start**

```bash
# Terminal 1 — API (Node 20 recommended)
cd server && cp .env.example .env   # set GEMINI_API_KEY
npm install && npm run dev          # :3001

# Terminal 2 — UI
cd client && npm install && npm run dev   # :5173
```

Demo fixtures: [`samples/`](./samples) (synthetic data only).

---

## Architecture

```text
React (Vite)  --multipart POST /api/analyze-->  Express
                                                 │
                    ┌────────────────────────────┼────────────────────────────┐
                    ▼                            ▼                            ▼
              Multer upload              Document processors            SQLite
           + validation utils            (PDF / TXT parsers)         documents table
                    │                            │
                    └────────────► promptBuilder + geminiService ──► Gemini (JSON)
```

- **Routes** stay thin; **services** own parsing, prompting, Gemini, and DB access.
- Each file stays a separate document (filename labeled in the prompt — no anonymous merge).
- Gemini is constrained to JSON: `summary`, `comparison`, `discrepancies`, `missingInformation`.

---

## Assumptions

- Documents are small enough for single-prompt context stuffing (no vector DB).
- PDFs are text-extractable (no OCR for scans).
- Single-operator local use — no auth in this MVP.
- Node 18+ / 20 with a valid `GEMINI_API_KEY`.
- Sample files are synthetic demo data, not real customers.

---

## Completed functionality

- Multi-file upload (PDF + TXT) with size/type validation  
- Text extraction; per-document boundaries preserved  
- SQLite persistence (`documents`: id, fileName, fileType, content, createdAt)  
- `POST /api/analyze` end-to-end (validate → parse → store → Gemini → JSON)  
- `GET /health`, `POST /api/documents`  
- React workbench: file select, prompt, loading/errors, result panels, Copy Result  
- Env-based config; safe filenames; error sanitization  
- Synthetic samples under `samples/`  
- Vitest PDF parser test  

---

## Known limitations

- No authentication, rate limiting, or multi-tenancy  
- No OCR; no embeddings / large-corpus retrieval  
- SQLite is local-file only (not multi-instance ready)  
- Open CORS in default dev config  
- Limited automated test coverage (parser only; Gemini calls not integration-tested)  
- LLM prompt-injection risk when document text is untrusted  

---

## Security considerations

| Control | Implementation |
|---------|----------------|
| File types | `.pdf` / `.txt` allowlist + MIME checks |
| Size | Configurable limit (`MAX_FILE_SIZE_MB`, default 5) |
| Content | PDF magic bytes (`%PDF`); TXT rejects NUL bytes |
| Paths | Uploads confined to `uploads/`; UUID disk names |
| Names | Client filenames sanitized before DB/prompts |
| Secrets | `GEMINI_API_KEY` from `.env` (gitignored); never logged |
| Errors | Paths/keys redacted; generic 500s in production |
| Other | Prompt length cap; `X-Powered-By` disabled; JSON body limit |

Still required before public deploy: auth, TLS, strict CORS, rate limits, key rotation.

---

## How the solution would be productionised

1. **Auth + quotas** — JWT/API keys; per-user rate limits on `/api/analyze`.  
2. **Secrets & network** — secret manager; HTTPS; lock `CORS_ORIGIN`.  
3. **Async jobs** — queue long Gemini runs; object storage for uploads; retention policy for SQLite/Postgres content.  
4. **Scale** — managed Postgres; horizontal API; optional embeddings for large corpora.  
5. **Hardening** — Helmet, WAF, malware scanning, structured logging/metrics, alerting on Gemini 429/401.  
6. **Quality** — OCR path; broader integration tests with mocked Gemini; CI pipeline.

---

## Automated test

**Framework:** Vitest  
**File:** [`server/tests/pdfParser.test.ts`](./server/tests/pdfParser.test.ts)

```bash
cd server && npm test
```

**What it validates:** `extractPdfText` against `samples/application.pdf` — real PDF→text extraction (company name, revenue, address, document id) and that a missing path throws `AppError`. This covers the critical parse step without depending on the Gemini network.

---

## Clear commit history

Initialize git (if needed) and keep commits small and reviewable, for example:

```text
chore: scaffold server Express + TypeScript baseline
feat(db): add SQLite documents schema and repository
feat(upload): multer upload with validation and safe filenames
feat(parse): PDF and TXT extraction + document processor
feat(ai): prompt builder and Gemini JSON analysis
feat(api): POST /api/analyze end-to-end pipeline
feat(ui): React workbench and analysis result components
test: add PDF parser Vitest coverage
docs: add README and sample synthetic documents
security: harden validation, env handling, and error redaction
```

Prefer imperative, scoped messages (`feat(api): …`) over large “WIP” dumps so reviewers can follow design decisions chronologically.
