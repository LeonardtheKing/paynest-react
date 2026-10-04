import { useEffect, useRef, useState } from 'react';
import { paystackReady, payWithPaystack } from '../paystack';

const QUICK = [1000, 5000, 10000];
const EMAIL_RE = /^\S+@\S+\.\S+$/;

export default function FundModal({ onClose, onDemoFund, onPaystackSuccess, notify }) {
  const [email, setEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const timer = useRef();
  const live = paystackReady();

  useEffect(() => () => clearTimeout(timer.current), []);

  const submit = (e) => {
    e.preventDefault();
    const value = parseFloat(amount);
    const mail = email.trim();
    if (!(value >= 100)) return notify('Minimum funding is ₦100');
    if (!EMAIL_RE.test(mail)) return notify('Enter a valid email');

    if (live) {
      payWithPaystack({
        email: mail,
        amountNaira: value,
        onSuccess: onPaystackSuccess,
        onCancel: () => notify('Payment cancelled'),
      });
      return;
    }

    // Demo mode (no Paystack key configured)
    setBusy(true);
    timer.current = setTimeout(() => {
      setBusy(false);
      onDemoFund(value);
    }, 1200);
  };

  return (
    <div className="modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <form className="sheet" onSubmit={submit}>
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
          onChange={(e) => setEmail(e.target.value)}
        />

        <label htmlFor="fAmt">Amount (₦)</label>
        <input
          id="fAmt"
          type="number"
          inputMode="decimal"
          min="0"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <div className="quick">
          {QUICK.map((n) => (
            <button type="button" className="chip" key={n} onClick={() => setAmount(String(n))}>
              ₦{n.toLocaleString('en-NG')}
            </button>
          ))}
        </div>

        <button className="btn" type="submit" disabled={busy}>
          {busy ? 'Processing…' : 'Pay with Paystack'}
        </button>
        <button type="button" className="btn ghost" onClick={onClose}>
          Cancel
        </button>
        <div className="note">
          {live
            ? 'Your balance is confirmed by the server after payment.'
            : 'Demo mode: set VITE_PAYSTACK_PK in .env to use Paystack.'}
        </div>
      </form>
    </div>
  );
}
