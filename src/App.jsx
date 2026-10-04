import { useCallback, useMemo, useState } from 'react';
import { useAccount } from './hooks/useAccount';
import { useTransactions } from './hooks/useTransactions';
import { useToast } from './hooks/useToast';
import { initials } from './format';
import { transferToBeneficiary } from './api';
import { clearPaymentParams, clearPending, getReferenceFromUrl } from './payments';
import BalanceCard from './components/BalanceCard';
import TransactionList from './components/TransactionList';
import ErrorBanner from './components/ErrorBanner';
import BottomNav from './components/BottomNav';
import SendForm from './components/SendForm';
import FundModal from './components/FundModal';
import PaymentCallback from './components/PaymentCallback';

export default function App() {
  const { account, loading, error, refresh } = useAccount();
  const txs = useTransactions(10);
  const { message, show } = useToast();
  const [view, setView] = useState('home');
  const [fundOpen, setFundOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  // Set when Paystack redirects the user back to us with ?reference=...
  const [paymentRef, setPaymentRef] = useState(getReferenceFromUrl);

  const balance = account?.balance ?? 0;

  const filtered = useMemo(
    () => txs.items.filter((t) => filter === 'all' || (filter === 'cr' ? t.amount > 0 : t.amount < 0)),
    [txs.items, filter]
  );

  // The server is the source of truth: reload balance and activity
  const reload = useCallback(() => {
    refresh();
    txs.refresh();
  }, [refresh, txs.refresh]);

  const closePayment = (retry = false) => {
    clearPending();
    clearPaymentParams();
    setPaymentRef(null);
    setView('home');
    reload();
    if (retry) setFundOpen(true);
  };

  // Rejects on failure so SendForm can show the server's message inline.
  const handleSend = async (payload) => {
    const result = await transferToBeneficiary(payload);
    show(result.message);
    setView('home');
    reload();
  };

  if (paymentRef) {
    return (
      <div className="app">
        <PaymentCallback
          reference={paymentRef}
          onSuccess={reload}
          onDone={() => closePayment()}
          onTryAgain={() => closePayment(true)}
        />
      </div>
    );
  }

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
                items={txs.items}
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

      {fundOpen && <FundModal onClose={() => setFundOpen(false)} />}

      {message && <div className="toast">{message}</div>}
    </>
  );
}
