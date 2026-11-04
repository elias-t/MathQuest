import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { api } from '../lib/api';
import { AuthContext, type AuthUser } from './auth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(() => !!localStorage.getItem('token'));

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    api.get('/auth/me')
      .then((me: AuthUser) => setUser(me))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
  }, []);

  async function signIn(token: string): Promise<AuthUser> {
    localStorage.setItem('token', token);
    const me: AuthUser = await api.get('/auth/me');
    setUser(me);
    return me;
  }

  function signOut() {
    setUser(null);
    localStorage.removeItem('token');
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
