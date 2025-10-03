"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface NavigationContextType {
  currentView: "discover" | "collection" | "profile" | "for-artists" | "about" | "contact";
  navigateToView: (view: "discover" | "collection" | "profile" | "for-artists" | "about" | "contact") => void;
  isMainApp: boolean;
  showDiscoverOverlay: boolean;
  closeDiscoverOverlay: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [currentView, setCurrentView] = useState<NavigationContextType['currentView']>("discover");
  const [showDiscoverOverlay, setShowDiscoverOverlay] = useState(false);

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
    console.log('🚀 NavigationContext: Navigating to view:', view, 'from pathname:', pathname);
    
    if (view === "discover") {
      // Always navigate to main app for discover
      if (pathname !== "/") {
        console.log('🚀 NavigationContext: Showing discover overlay instead of navigating');
        // Show discover overlay to prevent page reload
        setShowDiscoverOverlay(true);
        setCurrentView("discover");
        return;
      } else {
        console.log('🚀 NavigationContext: Already on discover page, updating view only');
        setCurrentView("discover");
      }
    } else {
      // Navigate to standalone pages
      const targetPath = `/${view}`;
      if (pathname !== targetPath) {
        console.log('🚀 NavigationContext: Navigating from', pathname, 'to', targetPath);
        router.push(targetPath, { scroll: false });
      }
      setCurrentView(view);
    }
  };

  const closeDiscoverOverlay = () => {
    setShowDiscoverOverlay(false);
  };

  return (
    <NavigationContext.Provider value={{ currentView, navigateToView, isMainApp, showDiscoverOverlay, closeDiscoverOverlay }}>
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
