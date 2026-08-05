import type { MissingInformationProps } from "../types/analysis";

export function MissingInformation({
  missingInformation,
}: MissingInformationProps) {
  return (
    <section className="result-block">
      <h3>Missing information</h3>
      {missingInformation.length === 0 ? (
        <p className="muted">No missing information identified.</p>
      ) : (
        <ul className="result-list">
          {missingInformation.map((item, index) => (
            <li key={`missing-${index}`}>{item}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
