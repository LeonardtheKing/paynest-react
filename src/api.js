import { API_BASE, USER_ID, BENEFICIARY_ID } from './config';
import { relativeDate } from './format';

const GET_TIMEOUT_MS = 15000;
const POST_TIMEOUT_MS = 30000;

/** Best human-readable message from an error body: {message}, ProblemDetails, validation errors, or plain text. */
function errorMessage(status, text) {
  let detail = '';
  try {
    const j = JSON.parse(text);
    detail =
      j?.message ||
      j?.title ||
      j?.detail ||
      (j?.errors && Object.values(j.errors).flat().filter(Boolean)[0]) ||
      '';
  } catch {
    detail = text ? text.slice(0, 120) : '';
  }
  return detail ? String(detail) : `Server responded ${status}`;
}

/** JSON request helper: timeout, HTTP errors, invalid JSON and network/CORS failures surface as readable Errors. */
async function request(path, { method = 'GET', body } = {}) {
  const post = method !== 'GET';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), post ? POST_TIMEOUT_MS : GET_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    const text = await res.text().catch(() => '');
    if (!res.ok) throw new Error(errorMessage(res.status, text));
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      if (!post) throw new Error('Server did not return valid JSON');
      return { message: text.slice(0, 200) }; // a successful write must not be reported as a failure
    }
  } catch (e) {
    if (e.name === 'AbortError') {
      throw new Error(
        post
          ? 'No response from the server. The request may still have been processed — check Activity before trying again.'
          : 'Request timed out'
      );
    }
    if (e instanceof TypeError) {
      throw new Error('Could not reach the server. Check your connection and that the API allows this origin (CORS).');
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

/** Throws when an otherwise-200 body reports failure, e.g. { status: "Failed", message: "..." }. */
function assertSuccess(json, fallback) {
  if (json && typeof json === 'object') {
    const bad = (typeof json.status === 'string' && !/^success/i.test(json.status)) || json.success === false;
    if (bad) throw new Error(json.message || fallback);
  }
}

/** Reads a field regardless of camelCase / PascalCase serialisation. */
const field = (obj, name) => obj?.[name] ?? obj?.[name.charAt(0).toUpperCase() + name.slice(1)];

/* ---------- Account ---------- */

export function normalizeAccount(raw) {
  const d = raw && typeof raw.data === 'object' && raw.data !== null ? raw.data : raw || {};
  return {
    accountNumber: String(d.accountNumber ?? ''),
    accountName: String(d.accountName ?? ''),
    bankName: String(d.bankName ?? ''),
    balance: Number(d.accountBalance ?? d.balance ?? 0) || 0,
  };
}

export async function fetchAccount() {
  return normalizeAccount(await request(`/api/bank/${encodeURIComponent(USER_ID)}`));
}

/* ---------- Transactions ---------- */

const cap = (s) => (s ? String(s).charAt(0).toUpperCase() + String(s).slice(1).toLowerCase() : '');

/** API transaction -> row shape used by TransactionList: { id, title, sub, date, ts, amount (signed), reference, status, isProcessed } */
export function normalizeTransaction(t) {
  const debit = /debit/i.test(String(t.type ?? ''));
  const amount = Math.abs(Number(t.amount) || 0);
  const channel = cap(t.channel);
  const status = String(t.status ?? '');

  const parts = [debit ? channel || 'Transfer' : channel ? `Paystack • ${channel}` : 'Paystack'];
  if (status && !/^success/i.test(status)) parts.push(cap(status)); // e.g. Pending, Failed

  const ts = Date.parse(t.dateCreated);
  return {
    id: String(t.id ?? t.reference),
    title: debit ? 'Transfer' : 'Wallet funding',
    sub: parts.join(' • '),
    date: relativeDate(t.dateCreated),
    ts: Number.isNaN(ts) ? 0 : ts,
    amount: debit ? -amount : amount,
    reference: String(t.reference ?? ''),
    status,
    isProcessed: t.isProcessed,
  };
}

export async function fetchTransactions(pageNumber = 1, pageSize = 10) {
  const json = await request(`/api/Transaction?pageNumber=${pageNumber}&pageSize=${pageSize}`);
  const list = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : [];
  return {
    items: list.map(normalizeTransaction),
    pageNumber: Number(json?.pageNumber) || pageNumber,
    totalPages: Number(json?.totalPages) || 1,
    totalCount: Number(json?.totalCount) || list.length,
  };
}

/** Looks a payment up by its reference in the server's transaction list (first few pages). */
export async function findTransactionByReference(reference) {
  const pageSize = 50;
  for (let page = 1; page <= 5; page++) {
    const { items, totalPages } = await fetchTransactions(page, pageSize);
    const hit = items.find((t) => t.reference === reference);
    if (hit) return hit;
    if (page >= totalPages) break;
  }
  return null;
}

/* ---------- Banks ---------- */

/** GET /api/bank/paystack-banks -> [{ name, code }] sorted by name, blanks and exact duplicates removed. */
export async function fetchBanks() {
  const json = await request('/api/bank/paystack-banks');
  assertSuccess(json, 'Could not load banks');
  const list = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : [];

  const seen = new Set();
  const banks = [];
  for (const b of list) {
    const name = String(b?.name ?? '').trim();
    const code = String(b?.code ?? '').trim();
    const key = `${code}|${name}`;
    if (!name || !code || seen.has(key)) continue;
    seen.add(key);
    banks.push({ name, code });
  }
  return banks.sort((a, b) => a.name.localeCompare(b.name));
}

/* ---------- Transfer ---------- */

/** POST /api/bank/transfer-to-beneficiary. Throws with the server's message on failure. */
export async function transferToBeneficiary({ accountNumber, amount, narration, bankCode }) {
  const json = await request('/api/bank/transfer-to-beneficiary', {
    method: 'POST',
    body: {
      senderUserId: USER_ID,
      accountNumber,
      beneficiaryId: BENEFICIARY_ID,
      amount,
      narration: narration || '',
      bankCode,
    },
  });
  assertSuccess(json, 'Transfer failed');
  return { message: (json && json.message) || 'Transfer successful' };
}

/* ---------- Funding ---------- */

/** POST /api/payments/initialize -> { message, authorizationUrl, reference }. `amount` is in naira. */
export async function initializePayment({ email, amount }) {
  const json = await request('/api/payments/initialize', {
    method: 'POST',
    body: { userId: USER_ID, email, amount },
  });
  assertSuccess(json, 'Could not start the payment');

  const authorizationUrl = field(json, 'authorizationUrl');
  const reference = field(json, 'reference');
  if (!authorizationUrl || !reference) {
    throw new Error('The server did not return a payment link. Please try again.');
  }
  return {
    message: field(json, 'message') || 'Payment initialized successfully.',
    authorizationUrl: String(authorizationUrl),
    reference: String(reference),
  };
}
