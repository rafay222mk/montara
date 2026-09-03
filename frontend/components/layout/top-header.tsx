'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  ChevronDown,
  Menu,
  Search,
  User,
  Settings,
  LogOut,
  CheckCheck,
  Megaphone,
  AlertTriangle,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useAuth } from '@/lib/auth/auth-context';
import { useNavigation } from '@/lib/navigation/navigation-context';
import { communicationApi } from '@/lib/api/communication';
import { Announcement, Role } from '@/types';

const roleLabels: Record<Role, string> = {
  SUPER_ADMIN: 'Super Admin',
  SCHOOL_ADMIN: 'School Admin',
  TEACHER: 'Teacher',
  PARENT: 'Parent',
  ACCOUNTANT: 'Accountant',
  HR_MANAGER: 'HR Manager',
  INVENTORY_MANAGER: 'Inventory Manager',
};

const READ_STORAGE_KEY = 'montara_read_notifications';

export function TopHeader({ onMenu }: { onMenu: () => void }) {
  const { user, logout } = useAuth();
  const { startNavigation } = useNavigation();
  const router = useRouter();

  const [notifications, setNotifications] = useState<Announcement[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);

  // Load read IDs from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(READ_STORAGE_KEY);
        if (stored) {
          setReadIds(JSON.parse(stored));
        }
      } catch (e) {
        console.error('Failed to parse read notifications from localStorage', e);
      }
    }
  }, []);

  // Fetch announcements for notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setNotifLoading(true);
    try {
      const data = await communicationApi.announcements.list();
      setNotifications(data || []);
    } catch (err) {
      console.warn('Failed to load notifications from announcements api', err);
    } finally {
      setNotifLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = (id: string) => {
    setReadIds((prev) => {
      if (prev.includes(id)) return prev;
      const updated = [...prev, id];
      if (typeof window !== 'undefined') {
        localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(updated));
      }
      return updated;
    });
  };

  const markAllAsRead = () => {
    const allIds = notifications.map((n) => n.id);
    setReadIds(allIds);
    if (typeof window !== 'undefined') {
      localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(allIds));
    }
  };

  const unreadCount = notifications.filter((n) => !readIds.includes(n.id)).length;

  const handleNotificationClick = (item: Announcement) => {
    markAsRead(item.id);
    setPopoverOpen(false);
    startNavigation('/communication');
    router.push('/communication');
  };

  const handleProfile = () => {
    startNavigation('/settings');
    router.push('/settings');
  };

  const handleSettings = () => {
    const target =
      user?.role === 'SUPER_ADMIN' || user?.role === 'SCHOOL_ADMIN'
        ? '/admin/settings'
        : '/settings';
    startNavigation(target);
    router.push(target);
  };

  const handleSearchClick = () => {
    startNavigation('/students');
    router.push('/students');
  };

  return (
    <header className="flex h-[76px] shrink-0 items-center justify-between border-b border-border/80 bg-background/90 px-4 backdrop-blur-md sm:px-8">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenu}
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="hidden h-8 items-center gap-2 text-xs text-muted-foreground sm:flex">
          <span>{user?.role === 'PARENT' ? 'Family space' : 'Workspace'}</span>
          <span className="text-border">/</span>
          <span className="text-foreground">Overview</span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Search button */}
        <button
          onClick={handleSearchClick}
          className="hidden h-9 items-center gap-2 rounded-md border border-border bg-card px-3 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground md:flex"
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
          <span>Search anything</span>
          <kbd className="ml-8 rounded border border-border px-1.5 py-0.5 text-[10px]">
            ⌘ K
          </kbd>
        </button>

        {/* Notifications Popover */}
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-9 w-9 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-1 focus-visible:ring-primary"
              aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
            >
              <Bell className="h-[18px] w-[18px]" />
              {unreadCount > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground shadow-sm">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            sideOffset={8}
            className="w-80 sm:w-96 p-0 border-border bg-[#11161a] shadow-xl"
          >
            {/* Popover Header */}
            <div className="flex items-center justify-between border-b border-border/80 px-4 py-3">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-foreground">Notifications</h4>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-medium text-primary">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1 px-2"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Mark read
                </Button>
              )}
            </div>

            {/* Popover Body */}
            <div className="max-h-[340px] overflow-y-auto divide-y divide-border/60">
              {notifLoading ? (
                <div className="flex h-28 items-center justify-center text-xs text-muted-foreground">
                  Loading notices...
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                  <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                    <Bell className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-xs font-medium text-foreground">No new notifications</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    You are all caught up with campus notices and events.
                  </p>
                </div>
              ) : (
                notifications.slice(0, 6).map((item) => {
                  const isRead = readIds.includes(item.id);
                  const isUrgent = item.priority === 'URGENT';
                  const isImportant = item.priority === 'IMPORTANT';

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleNotificationClick(item)}
                      className={`group flex cursor-pointer items-start gap-3 p-3.5 transition-colors hover:bg-muted/40 ${
                        !isRead ? 'bg-primary/[0.04]' : ''
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {isUrgent ? (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-destructive/15 text-destructive">
                            <AlertTriangle className="h-3.5 w-3.5" />
                          </div>
                        ) : (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <Megaphone className="h-3.5 w-3.5" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <p
                            className={`truncate text-xs ${
                              !isRead ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground'
                            }`}
                          >
                            {item.title}
                          </p>
                          {!isRead && (
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                          )}
                        </div>
                        <p className="line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
                          {item.content}
                        </p>
                        <div className="flex items-center gap-2 pt-0.5 text-[10px] text-muted-foreground/75 font-mono">
                          <Clock className="h-3 w-3" />
                          <span>
                            {item.publishedAt
                              ? new Date(item.publishedAt).toLocaleDateString()
                              : new Date(item.createdAt).toLocaleDateString()}
                          </span>
                          <span>·</span>
                          <span className="capitalize">{item.audience.toLowerCase()}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Popover Footer */}
            <div className="border-t border-border/80 p-2 bg-card/40">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-between text-xs text-primary hover:text-primary hover:bg-primary/10"
                onClick={() => {
                  setPopoverOpen(false);
                  startNavigation('/communication');
                  router.push('/communication');
                }}
              >
                <span>View all announcements</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Profile / Account Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-md p-1.5 transition-colors hover:bg-muted focus-visible:ring-1 focus-visible:ring-primary">
              <Avatar className="h-8 w-8 border border-primary/30">
                <AvatarFallback
                  className={user?.avatarColor || 'bg-primary/15 text-primary'}
                >
                  {user?.initials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-left sm:block">
                <span className="block text-xs font-medium text-foreground">
                  {user?.name}
                </span>
                <span className="block text-[10px] text-muted-foreground">
                  {user ? roleLabels[user.role] : ''}
                </span>
              </span>
              <ChevronDown className="hidden h-3.5 w-3.5 text-muted-foreground sm:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user ? roleLabels[user.role] : ''}
                </p>
                <p className="text-[11px] leading-none text-muted-foreground/80 pt-0.5">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleProfile} className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSettings} className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive cursor-pointer focus:text-destructive"
              onClick={logout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
