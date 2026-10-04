import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchTransactions } from '../api';

export function useTransactions(pageSize = 10) {
  const [state, setState] = useState({ items: [], page: 0, totalPages: 1, loading: true, error: '' });
  const latest = useRef(0);

  // append=false replaces the list (first page / refresh); append=true adds the next page.
  // Stale responses are ignored. Resolves with the page result, or null on failure.
  const load = useCallback(
    async (page, append) => {
      const id = ++latest.current;
      setState((s) => ({ ...s, loading: true, error: '' }));
      try {
        const res = await fetchTransactions(page, pageSize);
        if (id !== latest.current) return null;
        setState((s) => {
          const base = append ? s.items : [];
          const seen = new Set(base.map((t) => t.id));
          return {
            items: [...base, ...res.items.filter((t) => !seen.has(t.id))],
            page: res.pageNumber,
            totalPages: res.totalPages,
            loading: false,
            error: '',
          };
        });
        return res;
      } catch (e) {
        if (id === latest.current) setState((s) => ({ ...s, loading: false, error: e.message }));
        console.error('Transactions fetch failed:', e);
        return null;
      }
    },
    [pageSize]
  );

  const refresh = useCallback(() => load(1, false), [load]);
  const loadMore = useCallback(() => load(state.page + 1, true), [load, state.page]);

  useEffect(() => {
    refresh();
    return () => {
      latest.current++;
    };
  }, [refresh]);

  return {
    items: state.items,
    loading: state.loading,
    error: state.error,
    hasMore: state.page < state.totalPages,
    refresh,
    loadMore,
  };
}
