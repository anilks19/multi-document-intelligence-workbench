import type { DiscrepanciesProps } from "../types/analysis";

export function Discrepancies({ discrepancies }: DiscrepanciesProps) {
  return (
    <section className="result-block">
      <h3>Discrepancies</h3>
      {discrepancies.length === 0 ? (
        <p className="muted">No discrepancies found.</p>
      ) : (
        <ul className="result-list result-list--warn">
          {discrepancies.map((item, index) => (
            <li key={`discrepancy-${index}`}>{item}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
