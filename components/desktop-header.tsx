"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Search, Heart, User, Palette, Info, Mail, DollarSign } from "lucide-react";

// Desktop header props interface - supports terms and privacy pages
interface DesktopHeaderProps {
  currentPage?: "discover" | "collection" | "profile" | "for-artists" | "for-galleries" | "about" | "contact" | "pricing" | "login" | "register" | "terms" | "privacy";
  collectionCount?: number;
  setView: (view: "discover" | "collection" | "profile" | "for-artists" | "for-galleries" | "about" | "contact" | "pricing" | "terms" | "privacy") => void;
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

  const handleNavigation = (view: "discover" | "collection" | "profile" | "for-artists" | "for-galleries" | "about" | "contact" | "pricing") => {
    // Clear filters when navigating to Discover
    if (view === "discover" && (window as any).clearArtDiscoveryFilters) {
      (window as any).clearArtDiscoveryFilters();
    }
    // Also clear via callback if provided
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
        {/* Logo with improved mobile spacing */}
        <Button 
          variant="ghost" 
          className="flex items-center py-2 px-1 md:py-0 md:px-0"
          onClick={handleLogoClick}
        >
          <img 
            src="/logos/logo-desktop-32x32-v3.jpg" 
            alt="Kaleidorium Logo" 
            className="h-6 w-auto"
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
          
          {/* Filter Button - Only show on discover page */}
          {(isSelected("discover") || currentPage === "discover") && onToggleFilters && (
            <Button 
              variant="ghost" 
              className={`text-sm ${showFilters ? "bg-gray-100" : ""} ${isFiltering ? "text-blue-600" : ""}`}
              onClick={onToggleFilters}
            >
              <Search className="w-4 h-4 mr-1" />
              Filters
              {isFiltering && <span className="ml-1 w-2 h-2 bg-blue-600 rounded-full"></span>}
            </Button>
          )}
          
          <Button 
            variant="ghost" 
            className={`text-sm relative ${isSelected("collection") ? "bg-gray-100" : ""}`}
            onClick={() => handleNavigation("collection")}
          >
            <Heart className="w-4 h-4 mr-1" />
            Collection ({collectionCount})
          </Button>
          
          <Button 
            variant="ghost" 
            className={`text-sm ${isSelected("for-artists") ? "bg-gray-100" : ""}`}
            onClick={() => handleNavigation("for-artists")}
          >
            <Palette className="w-4 h-4 mr-1" />
            For Artists
          </Button>
          
          <Button 
            variant="ghost" 
            className={`text-sm ${isSelected("for-galleries") ? "bg-gray-100" : ""}`}
            onClick={() => handleNavigation("for-galleries")}
          >
            <Palette className="w-4 h-4 mr-1" />
            For Galleries
          </Button>
          
          <Button 
            variant="ghost" 
            className={`text-sm ${isSelected("about") ? "bg-gray-100" : ""}`}
            onClick={() => handleNavigation("about")}
          >
            <Info className="w-4 h-4 mr-1" />
            For Collectors
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

      {/* Mobile Menu - Hidden on desktop but kept for responsive design */}
      {showMenu && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-50">
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-700 hover:text-gray-900"
              onClick={() => handleNavigation("discover")}
            >
              <Palette className="mr-3 h-5 w-5" />
              Discover
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-700 hover:text-gray-900"
              onClick={() => handleNavigation("collection")}
            >
              <Heart className="mr-3 h-5 w-5" />
              Collection ({collectionCount})
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-700 hover:text-gray-900"
              onClick={() => handleNavigation("for-artists")}
            >
              <Palette className="mr-3 h-5 w-5" />
              For Artists
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-700 hover:text-gray-900"
              onClick={() => handleNavigation("for-galleries")}
            >
              <Palette className="mr-3 h-5 w-5" />
              For Galleries
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-700 hover:text-gray-900"
              onClick={() => handleNavigation("about")}
            >
              <Info className="mr-3 h-5 w-5" />
              For Collectors
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-700 hover:text-gray-900"
              onClick={() => handleNavigation("pricing")}
            >
              <DollarSign className="mr-3 h-5 w-5" />
              Pricing
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-700 hover:text-gray-900"
              onClick={() => handleNavigation("contact")}
            >
              <Mail className="mr-3 h-5 w-5" />
              Contact
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-700 hover:text-gray-900"
              onClick={() => handleNavigation("profile")}
            >
              <User className="mr-3 h-5 w-5" />
              Profile
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
