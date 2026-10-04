import { useEffect, useRef } from 'react';
import { formatNaira } from '../format';

const COPY = {
  verifying: {
    title: 'Confirming your payment…',
    body: "Please don't close or refresh this page.",
    label: 'Confirming',
  },
  success: {
    title: 'Payment successful',
    body: 'Your wallet has been credited.',
    label: 'Successful',
  },
  failed: {
    title: 'Payment failed',
    body: 'Your wallet was not credited. If your account was debited, contact support and quote the reference below.',
    label: 'Failed',
  },
  pending: {
    title: 'Still processing',
    body: "We haven't received confirmation yet. Your balance will update once the payment is confirmed, so it's safe to leave this page.",
    label: 'Processing',
  },
};

const ICON_PATHS = {
  success: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  failed: <path d="M6 6l12 12M18 6L6 18" />,
  pending: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
};

function StatusIcon({ status }) {
  if (status === 'verifying') return <div className="spinner" aria-hidden="true" />;
  return (
    <div className={`result-icon ${status}`} aria-hidden="true">
      <svg
        viewBox="0 0 24 24"
        width="40"
        height="40"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {ICON_PATHS[status]}
      </svg>
    </div>
  );
}

/**
 * Presentational payment result screen.
 * status: 'verifying' | 'success' | 'failed' | 'pending'
 */
export default function PaymentResult({ status, reference, amount, transaction, onDone, onTryAgain, onCheckAgain }) {
  const copy = COPY[status];
  const headingRef = useRef(null);

  // Move focus to the heading when the outcome changes so screen readers announce it
  useEffect(() => {
    headingRef.current?.focus();
  }, [status]);

  const when = transaction?.ts
    ? new Date(transaction.ts).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })
    : null;

  return (
    <section className="result" aria-live="polite">
      <StatusIcon status={status} />
      <h1 ref={headingRef} tabIndex={-1}>
        {copy.title}
      </h1>
      <p className="lead">{copy.body}</p>

      <div className="card receipt">
        {amount != null && (
          <div className="receipt-row">
            <span>Amount</span>
            <b>{formatNaira(amount)}</b>
          </div>
        )}
        <div className="receipt-row">
          <span>Status</span>
          <b className={status === 'success' ? 'cr' : status === 'failed' ? 'dr' : ''}>{copy.label}</b>
        </div>
        <div className="receipt-row">
          <span>Reference</span>
          <span className="ref">{reference}</span>
        </div>
        {when && (
          <div className="receipt-row">
            <span>Date</span>
            <span>{when}</span>
          </div>
        )}
      </div>

      {status === 'success' && (
        <div className="result-actions">
          <button className="btn" onClick={onDone}>
            Done
          </button>
        </div>
      )}
      {status === 'failed' && (
        <div className="result-actions">
          <button className="btn" onClick={onTryAgain}>
            Try again
          </button>
          <button className="btn ghost" onClick={onDone}>
            Back to wallet
          </button>
        </div>
      )}
      {status === 'pending' && (
        <div className="result-actions">
          <button className="btn" onClick={onCheckAgain}>
            Check again
          </button>
          <button className="btn ghost" onClick={onDone}>
            Back to wallet
          </button>
        </div>
      )}
    </section>
  );
}
