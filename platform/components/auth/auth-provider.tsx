'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  CommerceApiError,
  commerceRaw,
  commerceRequest,
  notifyAuthChanged,
} from '@/lib/commerce-api-client';

export type CommerceUser = {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
};

type AuthContextValue = {
  user: CommerceUser | null;
  loading: boolean;
  favoriteIds: string[];
  refreshUser: () => Promise<CommerceUser | null>;
  logout: () => Promise<void>;
  toggleFavorite: (productId: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CommerceUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  const refreshUser = useCallback(async () => {
    let current: CommerceUser;
    try {
      current = await commerceRequest<CommerceUser>('/auth/me');
    } catch (reason) {
      if (reason instanceof CommerceApiError && reason.status === 401) {
        setUser(null);
        setFavoriteIds(readGuestFavorites());
      }
      setLoading(false);
      return null;
    }

    setUser(current);
    try {
      await mergeGuestFavorites();
      setFavoriteIds(await loadServerFavorites());
    } catch {
      setFavoriteIds(readGuestFavorites());
    } finally {
      setLoading(false);
    }
    return current;
  }, []);

  useEffect(() => {
    queueMicrotask(() => void refreshUser());
    const handleAuthChange = () => void refreshUser();
    const handleAuthExpired = () => {
      setUser(null);
      setFavoriteIds(readGuestFavorites());
      setLoading(false);
    };
    window.addEventListener('net:auth-changed', handleAuthChange);
    window.addEventListener('net:auth-expired', handleAuthExpired);
    return () => {
      window.removeEventListener('net:auth-changed', handleAuthChange);
      window.removeEventListener('net:auth-expired', handleAuthExpired);
    };
  }, [refreshUser]);

  useEffect(() => {
    const sync = () => {
      if (user) {
        void loadServerFavorites().then(setFavoriteIds).catch(() => {});
      } else {
        setFavoriteIds(readGuestFavorites());
      }
    };
    window.addEventListener('net:favorites', sync);
    return () => window.removeEventListener('net:favorites', sync);
  }, [user]);

  const logout = useCallback(async () => {
    try {
      await commerceRaw('/auth/logout', { method: 'POST' }, false);
    } finally {
      setUser(null);
      setFavoriteIds(readGuestFavorites());
      notifyAuthChanged();
      window.dispatchEvent(new Event('net:favorites'));
    }
  }, []);

  const toggleFavorite = useCallback(
    async (productId: string) => {
      const saved = favoriteIds.includes(productId);
      const next = saved
        ? favoriteIds.filter((id) => id !== productId)
        : [...favoriteIds, productId];
      setFavoriteIds(next);
      try {
        if (user) {
          await commerceRequest(`/account/wishlist${saved ? `/${productId}` : ''}`, {
            method: saved ? 'DELETE' : 'POST',
            headers: saved ? undefined : { 'content-type': 'application/json' },
            body: saved ? undefined : JSON.stringify({ productId }),
          });
        } else {
          window.localStorage.setItem('net:favorites', JSON.stringify(next));
        }
        window.dispatchEvent(new Event('net:favorites'));
      } catch {
        setFavoriteIds(favoriteIds);
        throw new Error('Không thể cập nhật danh sách yêu thích.');
      }
    },
    [favoriteIds, user],
  );

  const value = useMemo(
    () => ({ user, loading, favoriteIds, refreshUser, logout, toggleFavorite }),
    [favoriteIds, loading, logout, refreshUser, toggleFavorite, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth phải được dùng bên trong AuthProvider.');
  return value;
}

async function mergeGuestFavorites() {
  let ids: string[] = [];
  try {
    const stored = JSON.parse(
      window.localStorage.getItem('net:favorites') ?? '[]',
    ) as unknown;
    if (Array.isArray(stored)) {
      ids = [...new Set(stored.filter((id): id is string => typeof id === 'string'))];
    }
  } catch {
    ids = [];
  }
  if (!ids.length) return;

  const results = await Promise.allSettled(
    ids.map((productId) =>
      commerceRequest('/account/wishlist', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ productId }),
      }),
    ),
  );
  const failed = ids.filter((_, index) => results[index]?.status === 'rejected');
  if (failed.length) {
    window.localStorage.setItem('net:favorites', JSON.stringify(failed));
  } else {
    window.localStorage.removeItem('net:favorites');
  }
}

function readGuestFavorites() {
  try {
    const stored = JSON.parse(window.localStorage.getItem('net:favorites') ?? '[]') as unknown;
    return Array.isArray(stored)
      ? [...new Set(stored.filter((id): id is string => typeof id === 'string'))]
      : [];
  } catch {
    return [];
  }
}

async function loadServerFavorites() {
  const result = await commerceRequest<{ items: { productId: string }[] }>(
    '/account/wishlist',
  );
  return result.items.map((item) => item.productId);
}
