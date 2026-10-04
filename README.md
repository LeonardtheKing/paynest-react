# PayNest Mini Bank (React + Vite)

## Run

```powershell
npm install
copy .env.example .env
npm run dev
```

Open http://localhost:5173. Restart `npm run dev` after editing `.env`.

## Endpoints used (base: `VITE_API_BASE`)

| Screen | Call |
| --- | --- |
| Balance card | `GET /api/bank/{VITE_USER_ID}` |
| Recent activity / Activity | `GET /api/Transaction?pageNumber=1&pageSize=10` |
| Send: bank dropdown | `GET /api/bank/paystack-banks` |
| Send: Send button | `POST /api/bank/transfer-to-beneficiary` (sender = `VITE_USER_ID`, beneficiary = `VITE_BENEFICIARY_ID`) |
| Fund: Pay with Paystack | `POST /api/payments/initialize` with `{ userId: VITE_USER_ID, email, amount }` |

## Funding flow

1. Fund sheet -> `POST /api/payments/initialize` (amount in naira, any amount above zero; Paystack/your API enforce their own limits).
2. The app redirects to the returned `authorizationUrl` (only https `*.paystack.com` links are followed).
3. Paystack sends the user back to the **callback URL** with `?reference=...&trxref=...`.
4. The app looks the reference up in `GET /api/Transaction` (polling for about 35 seconds) and shows
   success (status Success and processed), failed, or "still processing" if the server hasn't confirmed yet.
   The redirect itself is never trusted, and the wallet is credited only by your server.

Two different URLs are involved:

- **Callback URL** (browser): where the user returns after paying. Set it as `callback_url` in your server's
  Paystack initialize request, or in the Paystack dashboard, e.g. `http://localhost:5173/`.
- **Webhook URL** (server to server): where Paystack notifies your API so it can credit the wallet. Set in the Paystack
  dashboard (Settings -> API Keys & Webhooks); test and live mode have separate fields. It is not part of the payload.
