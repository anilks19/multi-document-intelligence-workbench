import { useState, type ChangeEvent, type FormEvent } from "react";
import { AnalysisResults } from "../components/AnalysisResults";
import { analyzeDocuments, getApiErrorMessage } from "../services/api";
import type { AnalyzeResponse } from "../types/analysis";

const ACCEPTED_TYPES = ".pdf,.txt,application/pdf,text/plain";

export function WorkbenchPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files;
    setFiles(selected ? Array.from(selected) : []);
    setError(null);
    setResult(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setResult(null);

    if (files.length === 0) {
      setError("Select at least one PDF or TXT file.");
      return;
    }

    if (!prompt.trim()) {
      setError("Enter an analysis prompt.");
      return;
    }

    setLoading(true);

    try {
      const data = await analyzeDocuments(files, prompt.trim());
      setResult(data);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <header className="header">
        <h1>Multi Document Intelligence Workbench</h1>
        <p>Upload PDF/TXT files, add a prompt, and run multi-document analysis.</p>
      </header>

      <form className="panel" onSubmit={handleSubmit}>
        <label className="field">
          <span>Documents</span>
          <input
            type="file"
            multiple
            accept={ACCEPTED_TYPES}
            onChange={handleFileChange}
            disabled={loading}
          />
        </label>

        {files.length > 0 && (
          <div className="file-list">
            <strong>Selected files</strong>
            <ul>
              {files.map((file) => (
                <li key={`${file.name}-${file.lastModified}-${file.size}`}>
                  {file.name}
                </li>
              ))}
            </ul>
          </div>
        )}

        <label className="field">
          <span>Analysis prompt</span>
          <textarea
            rows={4}
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Compare these documents. Find discrepancies and missing information."
            disabled={loading}
          />
        </label>

        <button type="submit" disabled={loading}>
          {loading ? "Analyzing…" : "Analyze"}
        </button>

        {loading && (
          <p className="muted">Uploading documents and running analysis…</p>
        )}
      </form>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {result && !loading && (
        <>
          <section className="panel saved-docs">
            <h2>Saved documents</h2>
            <ul>
              {result.documents.map((doc) => (
                <li key={doc.id}>
                  {doc.fileName} ({doc.fileType})
                </li>
              ))}
            </ul>
          </section>

          <AnalysisResults analysis={result.analysis} />
        </>
      )}
    </main>
  );
}
