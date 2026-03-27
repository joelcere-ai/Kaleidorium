"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Heart, User, Palette, Info, Mail, DollarSign } from "lucide-react";

// Desktop header props interface - supports terms and privacy pages
interface DesktopHeaderProps {
  currentPage?: "discover" | "collection" | "profile" | "why-kaleidorium" | "for-artists" | "for-galleries" | "about" | "contact" | "pricing" | "login" | "register" | "terms" | "privacy";
  collectionCount?: number;
  setView: (view: "discover" | "collection" | "profile" | "why-kaleidorium" | "for-artists" | "for-galleries" | "about" | "contact" | "pricing" | "terms" | "privacy") => void;
  onFilterChange?: (filters: any) => void;
  onClearFilters?: () => void;
  isFiltering?: boolean;
  showFilters?: boolean;
  onToggleFilters?: () => void;
}

export function DesktopHeader({ 
  currentPage, 
  collectionCount = 0, 
  setView, 
  onFilterChange, 
  onClearFilters, 
  isFiltering = false, 
  showFilters = false, 
  onToggleFilters 
}: DesktopHeaderProps) {
  const [showMenu, setShowMenu] = useState(false);
  const router = useRouter();

  const isSelected = (view: string) => currentPage === view;

  // "Why Kaleidorium?" is active when on the unified page OR any of the legacy sub-pages
  const isWhySelected = () =>
    currentPage === "why-kaleidorium" ||
    currentPage === "for-artists" ||
    currentPage === "for-galleries" ||
    currentPage === "about";

  const handleNavigation = (view: "discover" | "collection" | "profile" | "why-kaleidorium" | "for-artists" | "for-galleries" | "about" | "contact" | "pricing") => {
    if (view === "discover" && (window as any).clearArtDiscoveryFilters) {
      (window as any).clearArtDiscoveryFilters();
    }
    if (view === "discover" && onClearFilters) {
      onClearFilters();
    }
    setView(view);
    setShowMenu(false);
  };

  const handleLogoClick = () => {
    handleNavigation("discover");
    router.push("/", { scroll: false });
  };

  return (
    <header className="border-b bg-background relative app-header z-[110]">
      <div className="flex items-center justify-between p-4 md:p-6">
        {/* Logo */}
        <Button 
          variant="ghost" 
          className="flex items-center py-2 px-1 md:py-0 md:px-0 flex-shrink-0"
          onClick={handleLogoClick}
        >
          <img 
            src="/logos/kaleidorium-wordmark-desktop.png" 
            alt="Kaleidorium Logo" 
            className="h-8 md:h-10 w-auto flex-shrink-0"
          />
        </Button>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-4">
          <Button 
            variant="ghost" 
            className={`text-sm ${isSelected("discover") ? "bg-gray-100" : ""}`}
            onClick={() => handleNavigation("discover")}
          >
            <Palette className="w-4 h-4 mr-1" />
            Discover
          </Button>
          
          
          <Button 
            variant="ghost" 
            className={`text-sm relative ${isSelected("collection") ? "bg-gray-100" : ""}`}
            onClick={() => handleNavigation("collection")}
          >
            <Heart className="w-4 h-4 mr-1" />
            Collection ({collectionCount})
          </Button>

          {/* Unified "Why Kaleidorium?" — replaces For Artists / For Galleries / For Collectors */}
          <Button 
            variant="ghost" 
            className={`text-sm ${isWhySelected() ? "bg-gray-100" : ""}`}
            onClick={() => handleNavigation("why-kaleidorium")}
          >
            <Info className="w-4 h-4 mr-1" />
            Why Kaleidorium?
          </Button>
          
          <Button 
            variant="ghost" 
            className={`text-sm ${isSelected("pricing") ? "bg-gray-100" : ""}`}
            onClick={() => handleNavigation("pricing")}
          >
            <DollarSign className="w-4 h-4 mr-1" />
            Pricing
          </Button>
          
          <Button 
            variant="ghost" 
            className={`text-sm ${isSelected("contact") ? "bg-gray-100" : ""}`}
            onClick={() => handleNavigation("contact")}
          >
            <Mail className="w-4 h-4 mr-1" />
            Contact
          </Button>
          
          <Button 
            variant="ghost" 
            className={`text-sm ${isSelected("profile") ? "bg-gray-100" : ""}`}
            onClick={() => handleNavigation("profile")}
          >
            <User className="w-4 h-4 mr-1" />
            Account
          </Button>
        </nav>
      </div>

      {/* Mobile Menu (fallback — primary mobile nav is new-mobile-header) */}
      {showMenu && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-50">
            <Button variant="ghost" className="w-full justify-start text-gray-700 hover:text-gray-900"
              onClick={() => handleNavigation("discover")}>
              <Palette className="mr-3 h-5 w-5" />Discover
            </Button>
            <Button variant="ghost" className="w-full justify-start text-gray-700 hover:text-gray-900"
              onClick={() => handleNavigation("collection")}>
              <Heart className="mr-3 h-5 w-5" />Collection ({collectionCount})
            </Button>
            <Button variant="ghost" className="w-full justify-start text-gray-700 hover:text-gray-900"
              onClick={() => handleNavigation("why-kaleidorium")}>
              <Info className="mr-3 h-5 w-5" />Why Kaleidorium?
            </Button>
            <Button variant="ghost" className="w-full justify-start text-gray-700 hover:text-gray-900"
              onClick={() => handleNavigation("pricing")}>
              <DollarSign className="mr-3 h-5 w-5" />Pricing
            </Button>
            <Button variant="ghost" className="w-full justify-start text-gray-700 hover:text-gray-900"
              onClick={() => handleNavigation("contact")}>
              <Mail className="mr-3 h-5 w-5" />Contact
            </Button>
            <Button variant="ghost" className="w-full justify-start text-gray-700 hover:text-gray-900"
              onClick={() => handleNavigation("profile")}>
              <User className="mr-3 h-5 w-5" />Account
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
