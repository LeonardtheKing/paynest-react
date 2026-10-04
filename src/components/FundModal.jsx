import { useEffect, useState } from 'react';
import { initializePayment } from '../api';
import { USER_EMAIL } from '../config';
import { isTrustedCheckoutUrl, savePending } from '../payments';

const QUICK = [1000, 5000, 10000];
const METHODS = ['Card', 'Bank transfer', 'USSD'];
const EMAIL_RE = /^\S+@\S+\.\S+$/;

export default function FundModal({ onClose }) {
  const [email, setEmail] = useState(USER_EMAIL);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState(METHODS[0]); // display only: the initialize payload has no channel field
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Escape closes the sheet (not while a request is in flight)
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && !busy && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [busy, onClose]);

  // Coming back from Paystack via the back button can restore this page from the bfcache: don't stay stuck on "Connecting…"
  useEffect(() => {
    const onShow = (e) => e.persisted && setBusy(false);
    window.addEventListener('pageshow', onShow);
    return () => window.removeEventListener('pageshow', onShow);
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return; // one initialization per click: a second one would create a second payment

    const value = Math.round(parseFloat(amount) * 100) / 100;
    const mail = email.trim();
    if (!(value > 0)) return setError('Enter an amount');
    if (!EMAIL_RE.test(mail)) return setError('Enter a valid email');

    setBusy(true);
    setError('');
    try {
      const { authorizationUrl, reference } = await initializePayment({ email: mail, amount: value });
      if (!isTrustedCheckoutUrl(authorizationUrl)) {
        throw new Error('Received an unexpected payment link, so the payment was not started.');
      }
      savePending({ reference, amount: value });
      window.location.assign(authorizationUrl); // stay "busy": the browser is navigating away
    } catch (err) {
      setError(err.message || 'Could not start the payment');
      setBusy(false);
    }
  };

  return (
    <div className="modal" onClick={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <form className="sheet" role="dialog" aria-modal="true" aria-label="Fund wallet" onSubmit={submit} noValidate>
        <div className="ps">
          <span>Fund wallet</span>
          <span>
            Secured by <b>Paystack</b>
          </span>
        </div>

        <label htmlFor="fEmail">Email</label>
        <input
          id="fEmail"
          type="email"
          placeholder="intern@example.com"
          value={email}
          disabled={busy}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label htmlFor="fAmt">Amount (₦)</label>
        <input
          id="fAmt"
          type="number"
          inputMode="decimal"
          min="0"
          step="any"
          placeholder="0.00"
          value={amount}
          disabled={busy}
          onChange={(e) => setAmount(e.target.value)}
        />
        <div className="quick">
          {QUICK.map((n) => (
            <button type="button" className="chip" key={n} disabled={busy} onClick={() => setAmount(String(n))}>
              ₦{n.toLocaleString('en-NG')}
            </button>
          ))}
        </div>

        <div className="lbl">Pay with</div>
        <div className="chips">
          {METHODS.map((m) => (
            <button
              type="button"
              key={m}
              className={`chip${method === m ? ' on' : ''}`}
              disabled={busy}
              onClick={() => setMethod(m)}
            >
              {m}
            </button>
          ))}
        </div>

        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}

        <button className="btn" type="submit" disabled={busy}>
          {busy ? 'Connecting to Paystack…' : 'Pay with Paystack'}
        </button>
        <button type="button" className="btn ghost" disabled={busy} onClick={onClose}>
          Cancel
        </button>
        <div className="note">
          You'll be taken to Paystack's secure checkout. Your wallet is credited only after the payment is confirmed.
        </div>
      </form>
    </div>
  );
}
