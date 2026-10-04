import { useCallback, useMemo, useState } from 'react';
import { useAccount } from './hooks/useAccount';
import { useTransactions } from './hooks/useTransactions';
import { useToast } from './hooks/useToast';
import { initials } from './format';
import { transferToBeneficiary } from './api';
import BalanceCard from './components/BalanceCard';
import TransactionList from './components/TransactionList';
import ErrorBanner from './components/ErrorBanner';
import BottomNav from './components/BottomNav';
import SendForm from './components/SendForm';
import FundModal from './components/FundModal';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let seq = 0;

export default function App() {
  const { account, loading, error, refresh } = useAccount();
  const txs = useTransactions(10);
  const { message, show } = useToast();
  const [view, setView] = useState('home');
  const [fundOpen, setFundOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  // Session-only demo entries (demo funding and transfers, since there is no transfer endpoint yet)
  const [localTx, setLocalTx] = useState([]);

  const balance = (account?.balance ?? 0) + localTx.reduce((sum, t) => sum + t.amount, 0);

  const addLocalTx = useCallback((tx) => {
    const id = `local-${Date.now()}-${seq++}`;
    setLocalTx((list) => [{ id, date: 'Today', ts: Date.now(), ...tx }, ...list]);
  }, []);

  // Local demo entries first, then server transactions, newest first
  const allTx = useMemo(() => [...localTx, ...txs.items].sort((a, b) => b.ts - a.ts), [localTx, txs.items]);

  const filtered = useMemo(
    () => allTx.filter((t) => filter === 'all' || (filter === 'cr' ? t.amount > 0 : t.amount < 0)),
    [allTx, filter]
  );

  // After Paystack succeeds the server (webhook) credits the wallet: poll for the new balance + transaction.
  const syncAfterPayment = async (previous) => {
    for (let i = 0; i < 4; i++) {
      await sleep(i === 0 ? 800 : 2000);
      const [fresh] = await Promise.all([refresh(), txs.refresh()]);
      if (fresh && fresh.balance !== previous) return show('Wallet updated');
    }
    show('Payment received — balance will update shortly');
  };

  const handlePaystackSuccess = () => {
    const previous = account?.balance;
    setFundOpen(false);
    show('Payment successful');
    syncAfterPayment(previous);
  };

  const handleDemoFund = (amount) => {
    addLocalTx({ title: 'Wallet funding', sub: 'Demo', amount });
    setFundOpen(false);
    show('Payment successful (demo)');
  };

  // Rejects on failure so SendForm can show the server's message inline.
  const handleSend = async (payload) => {
    const result = await transferToBeneficiary(payload);
    show(result.message);
    setView('home');
    // The server is the source of truth: reload balance and activity
    refresh();
    txs.refresh();
  };

  return (
    <>
      <div className="app">
        <header>
          <div>
            <small>Welcome back</small>
            <h1>{account?.accountName || 'Intern Wallet'}</h1>
          </div>
          <div className="av">{initials(account?.accountName)}</div>
        </header>

        {view === 'home' && (
          <section>
            {error && <ErrorBanner message={error} onRetry={() => refresh()} retrying={loading} />}
            <BalanceCard account={account} balance={balance} loading={loading} />
            <div className="actions">
              <button className="act" onClick={() => setFundOpen(true)}>
                <span>➕</span>Fund
              </button>
              <button className="act" onClick={() => setView('send')}>
                <span>↗️</span>Send
              </button>
              <button className="act" onClick={() => setView('hist')}>
                <span>🧾</span>History
              </button>
            </div>
            <div className="sec">
              <b>Recent activity</b>
              <small className="link" onClick={() => setView('hist')}>
                See all
              </small>
            </div>
            <div className="card">
              <TransactionList
                items={allTx}
                limit={3}
                loading={txs.loading}
                error={txs.error}
                onRetry={txs.refresh}
              />
            </div>
          </section>
        )}

        {view === 'send' && (
          <section>
            <h1>Send money</h1>
            <SendForm balance={balance} onSend={handleSend} notify={show} />
          </section>
        )}

        {view === 'hist' && (
          <section>
            <h1>Activity</h1>
            <div className="chips">
              {[
                ['all', 'All'],
                ['cr', 'Money in'],
                ['dr', 'Money out'],
              ].map(([id, label]) => (
                <button key={id} className={`chip${filter === id ? ' on' : ''}`} onClick={() => setFilter(id)}>
                  {label}
                </button>
              ))}
            </div>
            <div className="card">
              <TransactionList
                items={filtered}
                loading={txs.loading}
                error={txs.error}
                onRetry={txs.refresh}
                hasMore={txs.hasMore}
                onLoadMore={txs.loadMore}
                empty="No transactions."
              />
            </div>
          </section>
        )}
      </div>

      <BottomNav view={view} onChange={setView} />

      {fundOpen && (
        <FundModal
          onClose={() => setFundOpen(false)}
          onDemoFund={handleDemoFund}
          onPaystackSuccess={handlePaystackSuccess}
          notify={show}
        />
      )}

      {message && <div className="toast">{message}</div>}
    </>
  );
}
