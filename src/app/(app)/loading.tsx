export default function Loading() {
  return (
    <div className="stack" role="status" aria-label="Carregando sua área">
      <p className="small muted">Conectando sua área à rede…</p>
      <div className="skeleton" aria-hidden="true" style={{ height: 54, maxWidth: 430 }} />
      <div className="metric-grid" aria-hidden="true">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="skeleton" style={{ height: 160 }} />
        ))}
      </div>
      <div className="skeleton" aria-hidden="true" style={{ height: 300 }} />
    </div>
  );
}
