import { useCallback, useEffect, useState } from 'react';

// A tiny hash router: "#/book?date=2026-10-12" gives path "/book" and query { date: "2026-10-12" }.
function parse() {
  const raw = window.location.hash.replace(/^#/, '') || '/';
  const [path, qs = ''] = raw.split('?');
  return { path: path || '/', query: Object.fromEntries(new URLSearchParams(qs)) };
}

export function useRoute() {
  const [route, setRoute] = useState(parse);

  useEffect(() => {
    const onChange = () => setRoute(parse());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  const navigate = useCallback((to) => {
    window.location.hash = to;
  }, []);

  return { ...route, navigate };
}
