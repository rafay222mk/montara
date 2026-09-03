'use client';

import { useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  CalendarCheck,
  ChevronLeft,
  CircleDollarSign,
  ClipboardCheck,
  Gauge,
  GraduationCap,
  LayoutDashboard,
  LibraryBig,
  Settings,
  Sparkles,
  Trophy,
  Users,
  WalletCards,
  HeartHandshake,
  Megaphone,
  Package,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth/auth-context';
import { hasPermission, Permission } from '@/lib/auth/permissions';
import { useNavigation } from '@/lib/navigation/navigation-context';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  permission: Permission;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const groups: NavGroup[] = [
  {
    label: 'Main',
    items: [
      { label: 'Dashboard', href: '/', icon: LayoutDashboard, permission: 'dashboard.view' },
      { label: 'Announcements', href: '/communication', icon: Megaphone, permission: 'communication.view' },
    ],
  },
  {
    label: 'Academic',
    items: [
      { label: 'Students', href: '/students', icon: Users, permission: 'students.view' },
      { label: 'Classrooms', href: '/classrooms', icon: LibraryBig, permission: 'classrooms.view' },
      { label: 'Attendance', href: '/attendance', icon: CalendarCheck, permission: 'attendance.view' },
      { label: 'Inventory', href: '/inventory', icon: Package, permission: 'inventory.view' },
    ],
  },
  {
    label: 'Learning',
    items: [
      { label: 'Observations', href: '/observations', icon: Sparkles, permission: 'observations.view' },
      { label: 'Assessments', href: '/assessments', icon: ClipboardCheck, permission: 'assessments.view' },
      { label: 'Curriculum', href: '/curriculum', icon: BookOpen, permission: 'curriculum.view' },
      { label: 'Lesson Planning', href: '/lesson-planning', icon: CalendarCheck, permission: 'lessons.view' },
      { label: 'Gamification', href: '/gamification', icon: Trophy, permission: 'gamification.view' },
      { label: 'Learning Progress', href: '/learning-progress', icon: Gauge, permission: 'progress.view' },
    ],
  },
  {
    label: 'HR',
    items: [
      { label: 'Employees', href: '/hr', icon: Users, permission: 'hr.view' },
      { label: 'Leave Requests', href: '/hr/leave', icon: CalendarCheck, permission: 'hr.view' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { label: 'Finance', href: '/finance', icon: CircleDollarSign, permission: 'finance.view' },
      { label: 'Fee Structures', href: '/finance/structures', icon: BookOpen, permission: 'finance.manage' },
      { label: 'Student Fees', href: '/finance/fees', icon: WalletCards, permission: 'finance.manage' },
      { label: 'Payments', href: '/finance/payments', icon: CircleDollarSign, permission: 'finance.manage' },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Settings', href: '/settings', icon: Settings, permission: 'settings.view' },
      { label: 'Admin / Settings', href: '/admin/settings', icon: Settings, permission: 'admin.view' },
    ],
  },
];

const parentGroups: NavGroup[] = [
  {
    label: 'Family',
    items: [
      { label: 'My children', href: '/parent', icon: HeartHandshake, permission: 'parent.view' },
      { label: 'Announcements', href: '/communication', icon: Megaphone, permission: 'communication.view' },
      { label: 'Attendance', href: '/attendance', icon: CalendarCheck, permission: 'attendance.view' },
      { label: 'Learning progress', href: '/learning-progress', icon: Gauge, permission: 'progress.view' },
      { label: 'Payments', href: '/finance/payments', icon: CircleDollarSign, permission: 'finance.view' },
    ],
  },
  {
    label: 'Account',
    items: [
      { label: 'Settings', href: '/settings', icon: Settings, permission: 'settings.view' },
    ],
  },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { isNavigating, navigatingTarget, startNavigation } = useNavigation();
  const navRef = useRef<HTMLElement>(null);

  const navigationGroups = user?.role === 'PARENT' ? parentGroups : groups;

  // Flatten all visible navigation hrefs for smart active route matching
  const allVisibleHrefs = useMemo(() => {
    if (!user) return [];
    return navigationGroups
      .flatMap((g) => g.items)
      .filter((item) => hasPermission(user.role, item.permission))
      .map((item) => item.href);
  }, [user, navigationGroups]);

  // Reset sidebar scroll position on route change
  useEffect(() => {
    if (navRef.current) {
      navRef.current.scrollTop = 0;
    }
  }, [pathname]);

  const checkIsActive = (href: string) => {
    if (href === '/') return pathname === '/';
    if (href === pathname) return true;

    // Sub-route match (e.g. /students/123 -> /students)
    if (pathname.startsWith(href + '/')) {
      const hasMoreSpecificMatch = allVisibleHrefs.some(
        (otherHref) =>
          otherHref !== href &&
          otherHref.startsWith(href) &&
          (pathname === otherHref || pathname.startsWith(otherHref + '/')),
      );
      return !hasMoreSpecificMatch;
    }

    return false;
  };

  const handleLinkClick = (href: string) => {
    if (href !== pathname) {
      startNavigation(href);
    }
    if (onNavigate) {
      onNavigate();
    }
  };

  return (
    <aside className="flex h-full w-[248px] shrink-0 flex-col border-r border-border/80 bg-[#11161a]">
      <div className="flex h-[76px] items-center justify-between border-b border-border/70 px-6">
        <Link
          href="/"
          onClick={() => handleLinkClick('/')}
          className={cn(
            'flex items-center gap-3',
            isNavigating && 'pointer-events-none',
          )}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="h-[19px] w-[19px]" />
          </span>
          <span>
            <span className="block text-[15px] font-bold tracking-[0.22em] text-foreground">
              MONTARA
            </span>
            <span className="block text-[9px] font-medium uppercase tracking-[0.13em] text-muted-foreground">
              School OS
            </span>
          </span>
        </Link>
        <button
          className="hidden rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground lg:block"
          aria-label="Collapse sidebar"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      <nav
        ref={navRef}
        className={cn(
          'flex-1 space-y-6 overflow-y-auto px-3 py-6 scroll-smooth',
          isNavigating && 'pointer-events-none select-none',
        )}
        aria-label="Main navigation"
      >
        {navigationGroups.map((group) => {
          const visibleItems = group.items.filter(
            (item) => user && hasPermission(user.role, item.permission),
          );
          if (!visibleItems.length) return null;

          return (
            <div key={group.label}>
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">
                {group.label}
              </p>
              <div className="space-y-1">
                {visibleItems.map(({ label, href, icon: Icon }) => {
                  const active = checkIsActive(href);
                  const isItemNavigating = isNavigating && navigatingTarget === href;

                  return (
                    <Link
                      key={label}
                      href={href}
                      onClick={() => handleLinkClick(href)}
                      className={cn(
                        'group flex items-center gap-3 rounded-md px-3 py-2.5 text-[13px] font-medium transition-colors relative',
                        active
                          ? 'bg-accent text-accent-foreground'
                          : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
                        isItemNavigating && 'bg-primary/10 text-primary font-semibold',
                      )}
                    >
                      <Icon
                        className={cn(
                          'h-[17px] w-[17px]',
                          active
                            ? 'text-primary'
                            : 'text-muted-foreground group-hover:text-foreground',
                          isItemNavigating && 'text-primary',
                        )}
                      />
                      <span>{label}</span>

                      {isItemNavigating ? (
                        <Loader2 className="ml-auto h-3.5 w-3.5 animate-spin text-primary" />
                      ) : active ? (
                        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-border/70 p-4">
        <div className="rounded-lg border border-primary/15 bg-primary/[0.06] p-3">
          <div className="mb-2 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]" />
            <span className="text-xs font-medium text-foreground">
              Term 3 in progress
            </span>
          </div>
          <p className="text-[11px] leading-4 text-muted-foreground">
            86 days remaining in the school year.
          </p>
          <div className="mt-3 h-1 rounded-full bg-muted">
            <div className="h-1 w-[72%] rounded-full bg-primary" />
          </div>
        </div>
      </div>
    </aside>
  );
}
