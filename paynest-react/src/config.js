export const API_BASE = (import.meta.env.VITE_API_BASE || 'https://innovation.runasp.net').replace(/\/+$/, '');
export const ACCOUNT_ID = import.meta.env.VITE_ACCOUNT_ID || 'a2481efe-5b07-4a54-a5b9-0de4c18a31e7';
export const PAYSTACK_PK = import.meta.env.VITE_PAYSTACK_PK || '';

// Transfers: the sending user and the (fixed, for now) beneficiary record
export const SENDER_USER_ID = import.meta.env.VITE_SENDER_USER_ID || 'a0152571-4056-474c-89d3-e5758a9965ef';
export const BENEFICIARY_ID = import.meta.env.VITE_BENEFICIARY_ID || 'a2481efe-5b07-4a54-a5b9-0de4c18a31e7';
