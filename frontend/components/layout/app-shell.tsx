'use client';

import { useState, useEffect } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Sidebar } from '@/components/layout/sidebar';
import { TopHeader } from '@/components/layout/top-header';
import { useAuth } from '@/lib/auth/auth-context';
import { useNavigation } from '@/lib/navigation/navigation-context';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();
  const { isNavigating } = useNavigation();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground animate-pulse">Loading workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-background relative ${isNavigating ? 'cursor-wait' : ''}`}>
      {/* Global Top Progress / Loading Bar */}
      {isNavigating && (
        <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-muted overflow-hidden">
          <div className="h-full w-full bg-primary animate-pulse origin-left scale-x-100 transition-all duration-300" />
        </div>
      )}

      {/* Subtle Floating Navigation Status Indicator */}
      {isNavigating && (
        <div className="fixed bottom-5 right-6 z-50 flex items-center gap-2 rounded-full border border-primary/25 bg-[#11161a]/95 px-4 py-2 shadow-2xl backdrop-blur-md">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
          <span className="text-xs font-medium text-foreground tracking-wide">Loading view...</span>
        </div>
      )}

      <div className="hidden lg:fixed lg:inset-y-0 lg:flex">
        <Sidebar />
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-[280px] border-border bg-[#11161a] p-0">
          <Sidebar onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
      <div className="flex min-h-screen flex-col lg:pl-[248px]">
        <TopHeader onMenu={() => setOpen(true)} />
        <main className={`flex-1 overflow-x-hidden transition-opacity duration-200 ${isNavigating ? 'pointer-events-none opacity-80' : 'opacity-100'}`}>
          <div className="mx-auto w-full max-w-[1600px] px-4 py-7 sm:px-8 lg:px-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
