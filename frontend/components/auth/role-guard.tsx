'use client';

import { useAuth } from '@/lib/auth/auth-context';
import { Permission } from '@/lib/auth/permissions';

export function RoleGuard({ permission, children, fallback = null }: { permission: Permission; children: React.ReactNode; fallback?: React.ReactNode }) {
  const { hasPermission } = useAuth();
  if (!hasPermission(permission)) return <>{fallback}</>;
  return <>{children}</>;
}

export function RoleSwitch({ role, children }: { role: 'admin' | 'teacher' | 'parent'; children: React.ReactNode }) {
  const { user } = useAuth();
  const currentRole = user?.role;
  const show = role === 'admin' ? (currentRole === 'SUPER_ADMIN' || currentRole === 'SCHOOL_ADMIN') : role === 'teacher' ? currentRole === 'TEACHER' : currentRole === 'PARENT';
  if (!show) return null;
  return <>{children}</>;
}
