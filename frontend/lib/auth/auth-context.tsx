'use client';

import { createContext, useContext, useMemo, useState, useEffect, useCallback } from 'react';
import { User, Role } from '@/types';
import { authApi } from '@/lib/api/auth';
import { hasPermission as checkPermission, Permission } from '@/lib/auth/permissions';
import { useRouter } from 'next/navigation';

interface AuthContextValue {
  user: User | null;
  role: Role | null;
  setRole: (role: Role) => void;
  hasPermission: (permission: Permission) => boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  role: null,
  setRole: () => {},
  hasPermission: () => false,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: () => {},
  refreshUser: async () => {},
});

const getInitials = (name: string): string => {
  if (!name) return 'US';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getAvatarColor = (role: Role): string => {
  switch (role) {
    case 'SUPER_ADMIN':
      return 'bg-amber-400/15 text-amber-300';
    case 'SCHOOL_ADMIN':
      return 'bg-primary/15 text-primary';
    case 'TEACHER':
      return 'bg-sky-400/15 text-sky-300';
    case 'PARENT':
      return 'bg-rose-400/15 text-rose-300';
    default:
      return 'bg-primary/15 text-primary';
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  const role = useMemo(() => user?.role || null, [user]);

  // Temporary function required to preserve UI preview dropdown capability
  const setRole = useCallback((newRole: Role) => {
    setUser((prevUser) => {
      if (!prevUser) return null;
      return {
        ...prevUser,
        role: newRole,
        avatarColor: getAvatarColor(newRole),
      };
    });
  }, []);

  const hasPermission = useCallback(
    (permission: Permission) => {
      if (!role) return false;
      return checkPermission(role, permission);
    },
    [role]
  );

  const logout = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('montara_access_token');
    }
    setUser(null);
    setIsLoading(false);
    router.push('/login');
  }, [router]);

  const refreshUser = useCallback(async () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('montara_access_token');
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const apiUser = await authApi.me();
      setUser({
        id: apiUser.id,
        name: apiUser.name,
        email: apiUser.email,
        role: apiUser.role,
        initials: getInitials(apiUser.name),
        avatarColor: getAvatarColor(apiUser.role),
        schoolName: 'Montara Academy',
      });
    } catch (error) {
      console.error('Failed to validate token on refresh:', error);
      // Clean up invalid session state
      localStorage.removeItem('montara_access_token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true);
      try {
        const response = await authApi.login({ email, password });
        localStorage.setItem('montara_access_token', response.accessToken);
        setUser({
          id: response.user.id,
          name: response.user.name,
          email: response.user.email,
          role: response.user.role,
          initials: getInitials(response.user.name),
          avatarColor: getAvatarColor(response.user.role),
          schoolName: 'Montara Academy',
        });
        router.push('/');
      } catch (error) {
        setIsLoading(false);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  // Initialize and check token validation on startup
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      role,
      setRole,
      hasPermission,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      refreshUser,
    }),
    [user, role, setRole, hasPermission, isLoading, login, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
