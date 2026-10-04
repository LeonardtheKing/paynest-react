import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchBanks } from '../api';

let cache = null; // the bank list rarely changes: fetch once per page load, reuse on every visit to Send

export function useBanks() {
  const [state, setState] = useState({ banks: cache ?? [], loading: !cache, error: '' });
  const latest = useRef(0);

  const load = useCallback(async () => {
    const id = ++latest.current;
    setState((s) => ({ ...s, loading: true, error: '' }));
    try {
      const banks = await fetchBanks();
      cache = banks;
      if (id === latest.current) setState({ banks, loading: false, error: '' });
    } catch (e) {
      if (id === latest.current) setState((s) => ({ ...s, loading: false, error: e.message }));
      console.error('Banks fetch failed:', e);
    }
  }, []);

  useEffect(() => {
    if (!cache) load();
    return () => {
      latest.current++;
    };
  }, [load]);

  return { ...state, retry: load };
}
