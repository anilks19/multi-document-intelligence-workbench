# Client — Multi-Document Intelligence Workbench UI

React + TypeScript + Vite frontend for multi-document upload and Gemini analysis results.

For the full project overview, architecture, and interview notes, see the **[root README](../README.md)**.

## Quick start

```bash
nvm use 20
npm install
npm run dev            # http://localhost:5173
```

Ensure the API is running on port **3001**. Vite proxies `/api` and `/health` to the backend.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Typecheck + production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Oxlint |

## Environment

Optional `VITE_API_BASE_URL` (see [`.env.example`](./.env.example)). Leave empty in local dev to use the proxy.

## Layout

```text
src/
  pages/WorkbenchPage.tsx     Main screen
  components/                 Summary, ComparisonTable, Discrepancies,
                              MissingInformation, AnalysisResults
  services/api.ts             Axios → POST /api/analyze
  types/analysis.ts           Shared response interfaces
```
