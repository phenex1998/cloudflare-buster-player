import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { XtreamCredentials, XtreamAuthInfo, xtreamApi } from '@/lib/xtream-api';

interface FavoriteItem {
  id: number | string;
  type: 'live' | 'vod' | 'series';
  name: string;
  icon?: string;
}

interface HistoryItem {
  id: number | string;
  type: 'live' | 'vod' | 'series';
  name: string;
  icon?: string;
  timestamp: number;
}

interface IptvContextType {
  credentials: XtreamCredentials | null;
  authInfo: XtreamAuthInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (creds: XtreamCredentials) => Promise<boolean>;
  logout: () => void;
  favorites: FavoriteItem[];
  toggleFavorite: (item: FavoriteItem) => void;
  isFavorite: (id: number | string, type: string) => boolean;
  history: HistoryItem[];
  addToHistory: (item: Omit<HistoryItem, 'timestamp'>) => void;
}

const IptvContext = createContext<IptvContextType | null>(null);

const CREDS_KEY = 'iptv_credentials';
const FAVORITES_KEY = 'iptv_favorites';
const HISTORY_KEY = 'iptv_history';

export function IptvProvider({ children }: { children: React.ReactNode }) {
  const [credentials, setCredentials] = useState<XtreamCredentials | null>(null);
  const [authInfo, setAuthInfo] = useState<XtreamAuthInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<FavoriteItem[]>(() => {
    const saved = localStorage.getItem(FAVORITES_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    const saved = localStorage.getItem(HISTORY_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }, [history]);

  // Try auto-login on mount
  useEffect(() => {
    const saved = localStorage.getItem(CREDS_KEY);
    if (saved) {
      const creds = JSON.parse(saved) as XtreamCredentials;
      xtreamApi.authenticate(creds)
        .then(info => {
          if (info.user_info.status === 'Active') {
            setCredentials(creds);
            setAuthInfo(info);
          } else {
            localStorage.removeItem(CREDS_KEY);
          }
        })
        .catch(() => localStorage.removeItem(CREDS_KEY))
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (creds: XtreamCredentials) => {
    setIsLoading(true);
    setError(null);
    try {
      const info = await xtreamApi.authenticate(creds);
      if (info.user_info.status === 'Active') {
        setCredentials(creds);
        setAuthInfo(info);
        localStorage.setItem(CREDS_KEY, JSON.stringify(creds));
        return true;
      }
      setError('Conta inativa ou expirada');
      return false;
    } catch (e) {
      setError('Falha na conexão. Verifique host, usuário e senha.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setCredentials(null);
    setAuthInfo(null);
    localStorage.removeItem(CREDS_KEY);
  }, []);

  const toggleFavorite = useCallback((item: FavoriteItem) => {
    setFavorites(prev => {
      const exists = prev.find(f => f.id === item.id && f.type === item.type);
      if (exists) return prev.filter(f => !(f.id === item.id && f.type === item.type));
      return [...prev, item];
    });
  }, []);

  const isFavorite = useCallback((id: number | string, type: string) => {
    return favorites.some(f => f.id === id && f.type === type);
  }, [favorites]);

  const addToHistory = useCallback((item: Omit<HistoryItem, 'timestamp'>) => {
    setHistory(prev => {
      const filtered = prev.filter(h => !(h.id === item.id && h.type === item.type));
      return [{ ...item, timestamp: Date.now() }, ...filtered].slice(0, 50);
    });
  }, []);

  return (
    <IptvContext.Provider value={{
      credentials, authInfo, isAuthenticated: !!credentials, isLoading, error,
      login, logout, favorites, toggleFavorite, isFavorite, history, addToHistory,
    }}>
      {children}
    </IptvContext.Provider>
  );
}

export function useIptv() {
  const ctx = useContext(IptvContext);
  if (!ctx) throw new Error('useIptv must be used within IptvProvider');
  return ctx;
}
