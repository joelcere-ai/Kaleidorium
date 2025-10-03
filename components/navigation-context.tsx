"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface NavigationContextType {
  currentView: "discover" | "collection" | "profile" | "for-artists" | "about" | "contact";
  navigateToView: (view: "discover" | "collection" | "profile" | "for-artists" | "about" | "contact") => void;
  isMainApp: boolean;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [currentView, setCurrentView] = useState<NavigationContextType['currentView']>("discover");

  // Determine if we're in the main app or a standalone page
  const isMainApp = pathname === "/";

  // Update current view based on pathname
  useEffect(() => {
    if (pathname === "/") {
      setCurrentView("discover");
    } else if (pathname === "/collection") {
      setCurrentView("collection");
    } else if (pathname === "/profile") {
      setCurrentView("profile");
    } else if (pathname === "/for-artists") {
      setCurrentView("for-artists");
    } else if (pathname === "/about") {
      setCurrentView("about");
    } else if (pathname === "/contact") {
      setCurrentView("contact");
    }
  }, [pathname]);

  const navigateToView = (view: "discover" | "collection" | "profile" | "for-artists" | "about" | "contact") => {
    console.log('🚀 NavigationContext: Navigating to view:', view);
    
    if (view === "discover") {
      // Always navigate to main app for discover
      if (pathname !== "/") {
        // Use replace to avoid adding to history and prevent reload feeling
        router.replace("/", { scroll: false });
      }
      setCurrentView("discover");
    } else {
      // Navigate to standalone pages
      const targetPath = `/${view}`;
      if (pathname !== targetPath) {
        router.push(targetPath, { scroll: false });
      }
      setCurrentView(view);
    }
  };

  return (
    <NavigationContext.Provider value={{ currentView, navigateToView, isMainApp }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}
