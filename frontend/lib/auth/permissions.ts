import { Role } from '@/types';

export type Permission =
  | 'dashboard.view'
  | 'students.view'
  | 'students.manage'
  | 'classrooms.view'
  | 'classrooms.manage'
  | 'curriculum.view'
  | 'curriculum.manage'
  | 'lessons.view'
  | 'lessons.manage'
  | 'gamification.view'
  | 'gamification.manage'
  | 'attendance.view'
  | 'attendance.manage'
  | 'observations.view'
  | 'observations.manage'
  | 'assessments.view'
  | 'assessments.manage'
  | 'progress.view'
  | 'finance.view'
  | 'finance.manage'
  | 'settings.view'
  | 'settings.manage'
  | 'parent.view'
  | 'hr.view'
  | 'hr.manage'
  | 'inventory.view'
  | 'inventory.manage'
  | 'communication.view'
  | 'communication.manage'
  | 'admin.view'
  | 'admin.manage'
  | 'ai.view';

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  SUPER_ADMIN: [
    'dashboard.view', 'students.view', 'students.manage', 'classrooms.view', 'classrooms.manage',
    'curriculum.view', 'curriculum.manage', 'lessons.view', 'lessons.manage',
    'gamification.view', 'gamification.manage',
    'attendance.view', 'attendance.manage', 'observations.view', 'observations.manage',
    'assessments.view', 'assessments.manage', 'progress.view',
    'finance.view', 'finance.manage', 'settings.view', 'settings.manage',
    'hr.view', 'hr.manage', 'inventory.view', 'inventory.manage',
    'communication.view', 'communication.manage',
    'admin.view', 'admin.manage', 'ai.view',
  ],
  SCHOOL_ADMIN: [
    'dashboard.view', 'students.view', 'students.manage', 'classrooms.view', 'classrooms.manage',
    'curriculum.view', 'curriculum.manage', 'lessons.view', 'lessons.manage',
    'gamification.view', 'gamification.manage',
    'attendance.view', 'attendance.manage', 'observations.view', 'observations.manage',
    'assessments.view', 'assessments.manage', 'progress.view',
    'finance.view', 'finance.manage', 'settings.view', 'settings.manage',
    'hr.view', 'hr.manage', 'inventory.view', 'inventory.manage',
    'communication.view', 'communication.manage',
    'admin.view', 'admin.manage', 'ai.view',
  ],
  TEACHER: [
    'dashboard.view', 'students.view', 'classrooms.view',
    'curriculum.view', 'curriculum.manage', 'lessons.view', 'lessons.manage',
    'gamification.view', 'gamification.manage',
    'attendance.view', 'attendance.manage', 'observations.view', 'observations.manage',
    'assessments.view', 'assessments.manage', 'progress.view', 'settings.view',
    'hr.view', 'inventory.view', 'communication.view', 'communication.manage',
    'ai.view',
  ],
  PARENT: [
    'parent.view', 'curriculum.view', 'gamification.view', 'attendance.view', 'observations.view', 'assessments.view', 'progress.view', 'finance.view', 'settings.view',
    'communication.view', 'ai.view',
  ],
  HR_MANAGER: [
    'dashboard.view', 'settings.view', 'hr.view', 'hr.manage', 'communication.view',
  ],
  INVENTORY_MANAGER: [
    'dashboard.view', 'settings.view', 'inventory.view', 'inventory.manage', 'communication.view',
  ],
  ACCOUNTANT: [
    'dashboard.view', 'students.view', 'settings.view', 'finance.view', 'finance.manage', 'communication.view',
  ],
};


export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

export function hasRole(role: Role, ...roles: Role[]): boolean {
  return roles.includes(role);
}

export function getPermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function canAccessFinance(role: Role): boolean {
  return hasPermission(role, 'finance.view');
}

export function canManageStudents(role: Role): boolean {
  return hasPermission(role, 'students.manage');
}

export function isParent(role: Role): boolean {
  return role === 'PARENT';
}

export function isAdmin(role: Role): boolean {
  return role === 'SUPER_ADMIN' || role === 'SCHOOL_ADMIN';
}
