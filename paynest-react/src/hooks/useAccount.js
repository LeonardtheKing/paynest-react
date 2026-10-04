import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchAccount } from '../api';

export function useAccount() {
  const [state, setState] = useState({ account: null, loading: true, error: '' });
  const latest = useRef(0);

  // Resolves with the fresh account, or null on failure. Stale responses are ignored.
  const refresh = useCallback(async () => {
    const id = ++latest.current;
    setState((s) => ({ ...s, loading: true, error: '' }));
    try {
      const account = await fetchAccount();
      if (id === latest.current) setState({ account, loading: false, error: '' });
      return account;
    } catch (e) {
      if (id === latest.current) setState((s) => ({ ...s, loading: false, error: e.message }));
      console.error('Account fetch failed:', e);
      return null;
    }
  }, []);

  useEffect(() => {
    refresh();
    return () => {
      latest.current++;
    };
  }, [refresh]);

  return { ...state, refresh };
}
