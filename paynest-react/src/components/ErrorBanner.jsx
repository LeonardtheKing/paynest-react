export default function ErrorBanner({ message, onRetry, retrying }) {
  return (
    <div className="card err" role="alert">
      <b>Couldn't load your account</b>
      <div className="muted err-msg">{message}</div>
      <button className="chip on" onClick={onRetry} disabled={retrying}>
        {retrying ? 'Retrying…' : 'Retry'}
      </button>
    </div>
  );
}
