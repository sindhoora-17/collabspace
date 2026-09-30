type PageStateProps = {
  title: string;
  message?: string;
  tone?: 'default' | 'error';
};

export function PageState({
  title,
  message,
  tone = 'default',
}: PageStateProps) {
  return (
    <div
      className={`page-state ${
        tone === 'error'
          ? 'page-state--error'
          : ''
      }`}
    >
      <div className="page-state-card">
        <h2>{title}</h2>

        {message && <p>{message}</p>}
      </div>
    </div>
  );
}