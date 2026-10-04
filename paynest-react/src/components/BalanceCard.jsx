import { formatNaira } from '../format';

export default function BalanceCard({ account, balance, loading }) {
  const line = account?.accountNumber
    ? `${account.bankName || 'PayNest'} • ${account.accountNumber}`
    : 'PayNest • ··········';

  return (
    <div className="bal">
      <div className="acct">Available balance</div>
      <div className={`amt${loading ? ' skel' : ''}`}>{formatNaira(balance)}</div>
      <div className="acct">{line}</div>
    </div>
  );
}
