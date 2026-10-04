import { formatNaira } from '../format';

function Row({ tx }) {
  const credit = tx.amount > 0;
  return (
    <div className="tx">
      <div className="ic">{credit ? '⬇️' : '⬆️'}</div>
      <div className="m">
        <b>{tx.title}</b>
        <small>
          {tx.sub}
          {tx.sub && tx.date ? ' · ' : ''}
          {tx.date}
        </small>
      </div>
      <span className={credit ? 'cr' : 'dr'}>
        {credit ? '+' : '−'}
        {formatNaira(Math.abs(tx.amount))}
      </span>
    </div>
  );
}

function SkeletonRows({ rows }) {
  return Array.from({ length: rows }, (_, i) => (
    <div className="tx" key={i} aria-hidden="true">
      <div className="ic sk" />
      <div className="m">
        <div className="sk" style={{ width: '55%', marginBottom: 8 }} />
        <div className="sk" style={{ width: '35%', height: 10 }} />
      </div>
      <div className="sk" style={{ width: 72 }} />
    </div>
  ));
}

/**
 * Presentational transaction list.
 * items: [{ id, title, sub, date, amount }]  (amount is signed: + credit, − debit)
 * limit: show only the first N rows (e.g. "Recent activity"); omit for the full list.
 */
export default function TransactionList({
  items,
  loading = false,
  error = '',
  onRetry,
  hasMore = false,
  onLoadMore,
  limit,
  empty = 'No transactions yet.',
}) {
  const visible = limit ? items.slice(0, limit) : items;

  return (
    <>
      {visible.map((tx) => (
        <Row key={tx.id} tx={tx} />
      ))}

      {loading && !visible.length && <SkeletonRows rows={limit || 3} />}

      {!loading && !error && !visible.length && <p className="muted">{empty}</p>}

      {error && (
        <div className="tx-error" role="alert">
          <span className="muted">{error}</span>
          <button className="chip on" onClick={onRetry}>
            Retry
          </button>
        </div>
      )}

      {!limit && hasMore && !error && (
        <button className="btn ghost" onClick={onLoadMore} disabled={loading}>
          {loading ? 'Loading…' : 'Load more'}
        </button>
      )}
    </>
  );
}
