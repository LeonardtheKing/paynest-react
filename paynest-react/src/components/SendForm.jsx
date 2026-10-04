import { useState } from 'react';
import { useBanks } from '../hooks/useBanks';

/**
 * onSend({ bankCode, accountNumber, amount, narration }) must return a promise
 * that rejects with an Error (shown inline) when the transfer fails.
 */
export default function SendForm({ balance, onSend, notify }) {
  const { banks, loading: banksLoading, error: banksError, retry } = useBanks();
  const [bankIdx, setBankIdx] = useState(''); // index into `banks`, so duplicate codes can't mis-select
  const [accountNumber, setAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [narration, setNarration] = useState('');
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState('');

  const bank = bankIdx === '' ? null : banks[Number(bankIdx)];

  const submit = async (e) => {
    e.preventDefault();
    if (sending) return;

    const value = parseFloat(amount);
    if (!bank) return notify('Select a bank');
    if (accountNumber.length !== 10) return notify('Enter a valid 10-digit account');
    if (!(value > 0)) return notify('Enter an amount');
    if (value > balance) return notify('Insufficient balance');

    setSending(true);
    setFormError('');
    try {
      await onSend({ bankCode: bank.code, accountNumber, amount: value, narration: narration.trim() });
      setBankIdx('');
      setAccountNumber('');
      setAmount('');
      setNarration('');
    } catch (err) {
      setFormError(err.message || 'Transfer failed');
    } finally {
      setSending(false);
    }
  };

  const placeholder = banksLoading ? 'Loading banks…' : banksError ? 'Banks unavailable' : 'Select bank';

  return (
    <form className="card" style={{ marginTop: 12 }} onSubmit={submit}>
      <label htmlFor="bank">Bank</label>
      <select
        id="bank"
        value={bankIdx}
        onChange={(e) => setBankIdx(e.target.value)}
        disabled={banksLoading || !!banksError || sending}
      >
        <option value="">{placeholder}</option>
        {banks.map((b, i) => (
          <option key={`${b.code}-${i}`} value={i}>
            {b.name}
          </option>
        ))}
      </select>
      {banksError && (
        <div className="field-error" role="alert">
          <span>{banksError}</span>
          <button type="button" className="chip on" onClick={retry}>
            Retry
          </button>
        </div>
      )}

      <label htmlFor="acc">Account number</label>
      <input
        id="acc"
        inputMode="numeric"
        maxLength={10}
        placeholder="10-digit account number"
        value={accountNumber}
        disabled={sending}
        onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
      />

      <label htmlFor="amt">Amount (₦)</label>
      <input
        id="amt"
        type="number"
        inputMode="decimal"
        min="0"
        placeholder="0.00"
        value={amount}
        disabled={sending}
        onChange={(e) => setAmount(e.target.value)}
      />

      <label htmlFor="nar">Narration (optional)</label>
      <input
        id="nar"
        placeholder="e.g. Lunch"
        value={narration}
        disabled={sending}
        onChange={(e) => setNarration(e.target.value)}
      />

      {formError && (
        <div className="form-error" role="alert">
          {formError}
        </div>
      )}

      <button className="btn" type="submit" disabled={sending || banksLoading}>
        {sending ? 'Sending…' : 'Send'}
      </button>
    </form>
  );
}
