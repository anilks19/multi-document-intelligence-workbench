import type { SummaryProps } from "../types/analysis";

export function Summary({ summary }: SummaryProps) {
  return (
    <section className="result-block">
      <h3>Summary</h3>
      <p className="summary-text">{summary || "No summary available."}</p>
    </section>
  );
}
