'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';

interface NavigationContextType {
  isNavigating: boolean;
  navigatingTarget: string | null;
  startNavigation: (href: string) => void;
  stopNavigation: () => void;
}

const NavigationContext = createContext<NavigationContextType>({
  isNavigating: false,
  navigatingTarget: null,
  startNavigation: () => {},
  stopNavigation: () => {},
});

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const [navigatingTarget, setNavigatingTarget] = useState<string | null>(null);

  // Automatically reset navigation loading state when route pathname updates
  useEffect(() => {
    setIsNavigating(false);
    setNavigatingTarget(null);
  }, [pathname]);

  // Safety timeout: prevent loading state from getting stuck forever if route change cancels
  useEffect(() => {
    if (isNavigating) {
      const timer = setTimeout(() => {
        setIsNavigating(false);
        setNavigatingTarget(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isNavigating]);

  const startNavigation = useCallback((href: string) => {
    // Only trigger loading state if actually changing routes
    if (href && href !== pathname) {
      setIsNavigating(true);
      setNavigatingTarget(href);
    }
  }, [pathname]);

  const stopNavigation = useCallback(() => {
    setIsNavigating(false);
    setNavigatingTarget(null);
  }, []);

  return (
    <NavigationContext.Provider
      value={{
        isNavigating,
        navigatingTarget,
        startNavigation,
        stopNavigation,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  return useContext(NavigationContext);
}
