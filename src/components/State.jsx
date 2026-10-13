/** Loading, error and empty states shared by every list. */
export function Loading({ text = 'Loading' }) {
  return <p className="muted" role="status">{text}...</p>;
}

export function ErrorNote({ error, onRetry }) {
  if (!error) return null;
  return (
    <div className="note error" role="alert">
      <span>{error.message}</span>
      {onRetry && <button type="button" className="btn small secondary" onClick={onRetry}>Try again</button>}
    </div>
  );
}

export function Empty({ title, children }) {
  return (
    <div className="empty">
      <strong>{title}</strong>
      {children && <p>{children}</p>}
    </div>
  );
}
