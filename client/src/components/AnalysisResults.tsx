import { useState } from "react";
import type { AnalysisResultsProps } from "../types/analysis";
import { ComparisonTable } from "./ComparisonTable";
import { Discrepancies } from "./Discrepancies";
import { MissingInformation } from "./MissingInformation";
import { Summary } from "./Summary";

function formatAnalysisForCopy(analysis: AnalysisResultsProps["analysis"]): string {
  return JSON.stringify(analysis, null, 2);
}

export function AnalysisResults({ analysis }: AnalysisResultsProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(formatAnalysisForCopy(analysis));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="panel results">
      <div className="results-header">
        <h2>Results</h2>
        <button type="button" className="copy-btn" onClick={handleCopy}>
          {copied ? "Copied!" : "Copy Result"}
        </button>
      </div>

      <Summary summary={analysis.summary} />
      <ComparisonTable comparison={analysis.comparison} />
      <Discrepancies discrepancies={analysis.discrepancies} />
      <MissingInformation missingInformation={analysis.missingInformation} />
    </section>
  );
}
