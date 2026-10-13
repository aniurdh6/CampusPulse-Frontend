import { useCallback, useEffect, useState } from 'react';

/**
 * Runs an async loader on mount and whenever deps change.
 * `reload()` refetches quietly (no loading flash), which suits polling and post-save refreshes.
 */
export function useLoad(loader, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(async () => {
    try {
      const data = await loader();
      setState({ data, error: null, loading: false });
    } catch (error) {
      setState((s) => ({ ...s, error, loading: false }));
    }
  }, deps);

  useEffect(() => {
    setState((s) => ({ ...s, loading: true }));
    run();
  }, [run]);

  return { ...state, reload: run };
}
