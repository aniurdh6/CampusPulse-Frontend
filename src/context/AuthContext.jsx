import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, tokenStore } from '../lib/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(tokenStore.get()));

  useEffect(() => {
    if (!tokenStore.get()) {
      setLoading(false);
      return;
    }
    api.me()
      .then(setUser)
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const onUnauthorized = () => setUser(null);
    window.addEventListener('cp:unauthorized', onUnauthorized);
    return () => window.removeEventListener('cp:unauthorized', onUnauthorized);
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.login({ email, password });
    tokenStore.set(res.token);
    setUser(res.user);
    window.location.hash = '/';
  }, []);

  const register = useCallback(async (form) => {
    const res = await api.register(form);
    tokenStore.set(res.token);
    setUser(res.user);
    window.location.hash = '/';
  }, []);

  const logout = useCallback(async () => {
    try { await api.logout(); } catch { /* token may already be gone */ }
    tokenStore.clear();
    setUser(null);
    window.location.hash = '/';
  }, []);

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
