# PayNest Mini Bank (React + Vite)

## Run

```powershell
npm install
copy .env.example .env
npm run dev
```

Open http://localhost:5173.

## Endpoints used (base: `VITE_API_BASE`)

| Screen | Call |
| --- | --- |
| Balance card | `GET /api/bank/{VITE_ACCOUNT_ID}` |
| Recent activity / Activity | `GET /api/Transaction?pageNumber=1&pageSize=10` |
| Send: bank dropdown | `GET /api/bank/paystack-banks` |
| Send: Send button | `POST /api/bank/transfer-to-beneficiary` |

The transfer payload is `{ senderUserId, accountNumber, beneficiaryId, amount, narration, bankCode }`.
`senderUserId` and `beneficiaryId` come from `VITE_SENDER_USER_ID` and `VITE_BENEFICIARY_ID`;
the account number, amount, narration and bank code come from the form.

## Notes

- After a transfer the app reloads the balance and activity from the server.
- With `VITE_PAYSTACK_PK` set, funding opens Paystack, then re-fetches the account
  (up to 4 times) so the balance reflects what your server/webhook credited.
  Without a key, funding runs in demo mode (local, session-only).
