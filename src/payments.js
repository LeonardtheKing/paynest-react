/* Helpers for the Paystack redirect flow. The browser is never the source of truth for a payment:
   the return URL only tells us WHICH payment to look up; the result always comes from the server. */

const PENDING_KEY = 'paynest.pendingPayment';
const REFERENCE_RE = /^[A-Za-z0-9._=-]{1,100}$/;

/** Only follow https links on paystack.com, so a tampered response can't redirect users elsewhere. */
export function isTrustedCheckoutUrl(raw) {
  try {
    const u = new URL(raw);
    return u.protocol === 'https:' && (u.hostname === 'paystack.com' || u.hostname.endsWith('.paystack.com'));
  } catch {
    return false;
  }
}

/** Remember the payment we started (for the amount on the result screen if the server can't find it yet). */
export function savePending({ reference, amount }) {
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify({ reference, amount, at: Date.now() }));
  } catch {
    /* storage unavailable (private mode): the result screen still works from the server data */
  }
}

export function readPending(reference) {
  try {
    const p = JSON.parse(sessionStorage.getItem(PENDING_KEY) || 'null');
    return p && p.reference === reference ? p : null;
  } catch {
    return null;
  }
}

export function clearPending() {
  try {
    sessionStorage.removeItem(PENDING_KEY);
  } catch {
    /* ignore */
  }
}

/** Paystack returns the user to the callback URL as ?reference=...&trxref=... */
export function getReferenceFromUrl() {
  const q = new URLSearchParams(window.location.search);
  const ref = q.get('reference') || q.get('trxref');
  return ref && REFERENCE_RE.test(ref) ? ref : null;
}

/** Drop the payment params so a refresh doesn't re-open the result screen. */
export function clearPaymentParams() {
  const url = new URL(window.location.href);
  url.searchParams.delete('reference');
  url.searchParams.delete('trxref');
  window.history.replaceState({}, '', url.pathname + url.search + url.hash);
}

/**
 * Server transaction -> 'success' | 'failed' | 'pending'.
 * Success requires the server to have finished processing (wallet credited), not just Paystack saying "paid".
 */
export function classifyPayment(tx) {
  if (!tx) return 'pending';
  const status = String(tx.status || '');
  if (/^success/i.test(status)) return tx.isProcessed === false ? 'pending' : 'success';
  if (/fail|abandon|declin|revers|cancel|error/i.test(status)) return 'failed';
  return 'pending';
}
