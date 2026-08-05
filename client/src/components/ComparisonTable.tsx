import type { ComparisonTableProps } from "../types/analysis";

export function ComparisonTable({ comparison }: ComparisonTableProps) {
  return (
    <section className="result-block">
      <h3>Comparison</h3>
      {comparison.length === 0 ? (
        <p className="muted">No comparison points.</p>
      ) : (
        <div className="table-wrap">
          <table className="comparison-table">
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Point</th>
              </tr>
            </thead>
            <tbody>
              {comparison.map((point, index) => (
                <tr key={`comparison-${index}`}>
                  <td>{index + 1}</td>
                  <td>{point}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
