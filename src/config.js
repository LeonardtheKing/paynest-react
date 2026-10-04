export const API_BASE = (import.meta.env.VITE_API_BASE || 'https://innovation.runasp.net').replace(/\/+$/, '');

// The signed-in user: their balance is read, their wallet is funded, and transfers are sent from this id.
export const USER_ID = import.meta.env.VITE_USER_ID || 'a0152571-4056-474c-89d3-e5758a9965ef';
export const USER_EMAIL = import.meta.env.VITE_USER_EMAIL || 'leonardizuchukwu3@gmail.com';

// Transfers go to this (fixed, for now) beneficiary record
export const BENEFICIARY_ID = import.meta.env.VITE_BENEFICIARY_ID || 'a2481efe-5b07-4a54-a5b9-0de4c18a31e7';
