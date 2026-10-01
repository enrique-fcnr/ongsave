export default function Loading() {
  return (
    <div className="stack" aria-label="Carregando">
      <div className="skeleton" />
      <div className="metric-grid">
        <div className="skeleton" />
        <div className="skeleton" />
      </div>
      <div className="skeleton" style={{ height: 300 }} />
    </div>
  );
}
