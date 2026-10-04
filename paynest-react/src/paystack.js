import { PAYSTACK_PK } from './config';

export const paystackReady = () => Boolean(PAYSTACK_PK) && typeof window.PaystackPop !== 'undefined';

export function payWithPaystack({ email, amountNaira, onSuccess, onCancel }) {
  const handler = window.PaystackPop.setup({
    key: PAYSTACK_PK,
    email,
    amount: Math.round(amountNaira * 100), // kobo
    currency: 'NGN',
    ref: `PN_${Date.now()}`,
    // Paystack requires plain (non-async) callbacks
    callback: (response) => onSuccess(response.reference),
    onClose: onCancel,
  });
  handler.openIframe();
}
