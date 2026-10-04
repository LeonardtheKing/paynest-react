import { useEffect, useRef } from 'react';
import { usePaymentVerification } from '../hooks/usePaymentVerification';
import { readPending } from '../payments';
import PaymentResult from './PaymentResult';

/** Shown when Paystack redirects back with ?reference=...: verifies with the server, then renders the outcome. */
export default function PaymentCallback({ reference, onSuccess, onDone, onTryAgain }) {
  const { status, transaction, retry } = usePaymentVerification(reference);

  // Refresh balance/activity as soon as the payment is confirmed (callback kept in a ref so it fires once)
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;
  useEffect(() => {
    if (status === 'success') onSuccessRef.current?.();
  }, [status]);

  const pending = readPending(reference);
  const amount = transaction ? Math.abs(transaction.amount) : (pending?.amount ?? null);

  return (
    <PaymentResult
      status={status}
      reference={reference}
      amount={amount}
      transaction={transaction}
      onDone={onDone}
      onTryAgain={onTryAgain}
      onCheckAgain={retry}
    />
  );
}
