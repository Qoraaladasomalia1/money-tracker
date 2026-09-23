import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api, setToken } from '../lib/api';
import type { Summary, Transaction, User } from '../lib/types';

interface AuthState {
  user: User | null;
  loading: boolean;
  summary: Summary | null;
  transactions: Transaction[];
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthState | null>(null);

const emptySummary: Summary = {
  balance: 0,
  totalReceived: 0,
  totalSpent: 0,
  todaySpending: 0,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const refresh = useCallback(async () => {
    const [me, txData, sum] = await Promise.all([
      api<{ user: User }>('/api/auth/me'),
      api<{ transactions: Transaction[]; summary: Summary }>('/api/transactions'),
      api<Summary>('/api/summary'),
    ]);
    setUser(me.user);
    setTransactions(txData.transactions);
    setSummary(sum);

    document.documentElement.classList.toggle('dark', me.user.theme === 'dark');
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('mt_token');
    if (!token) {
      setLoading(false);
      return;
    }
    refresh()
      .catch(() => {
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, [refresh]);

  const login = async (email: string, password: string) => {
    const data = await api<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(data.token);
    setUser(data.user);
    await refresh();
  };

  const register = async (name: string, email: string, password: string) => {
    const data = await api<{ token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    setToken(data.token);
    setUser(data.user);
    await refresh();
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setSummary(null);
    setTransactions([]);
    document.documentElement.classList.remove('dark');
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      summary: summary || emptySummary,
      transactions,
      login,
      register,
      logout,
      refresh,
      setUser,
    }),
    [user, loading, summary, transactions, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
