import { useCallback, useEffect, useRef, useState } from 'react';
import { findTransactionByReference } from '../api';
import { classifyPayment } from '../payments';

// Wait for the server (Paystack webhook) to record the payment: ~35s in total, then give up gracefully.
const DELAYS_MS = [1000, 2000, 2000, 3000, 3000, 4000, 4000, 5000, 5000, 5000];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Resolves a payment from SERVER state (never from the redirect URL).
 * status: 'verifying' | 'success' | 'failed' | 'pending' (not confirmed in time; may still complete)
 */
export function usePaymentVerification(reference) {
  const [state, setState] = useState({ status: 'verifying', transaction: null });
  const run = useRef(0);

  const verify = useCallback(async () => {
    const id = ++run.current;
    setState({ status: 'verifying', transaction: null });

    for (let attempt = 0; attempt <= DELAYS_MS.length; attempt++) {
      let tx = null;
      try {
        tx = await findTransactionByReference(reference);
      } catch (e) {
        console.error('Payment lookup failed (will retry):', e);
      }
      if (id !== run.current) return; // unmounted or superseded

      const outcome = classifyPayment(tx);
      if (outcome === 'success' || outcome === 'failed') {
        setState({ status: outcome, transaction: tx });
        return;
      }
      if (attempt === DELAYS_MS.length) break;
      await sleep(DELAYS_MS[attempt]);
      if (id !== run.current) return;
    }
    setState({ status: 'pending', transaction: null });
  }, [reference]);

  useEffect(() => {
    verify();
    return () => {
      run.current++;
    };
  }, [verify]);

  return { ...state, retry: verify };
}
