"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Menu, X, User, Search, Heart, Palette, Info, Mail, AtSign } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface UniversalAppHeaderProps {
  currentPage?: "discover" | "collection" | "profile" | "for-artists" | "about" | "contact" | "login" | "register";
  collectionCount?: number;
  onFilterChange?: (filters: any) => void;
  onClearFilters?: () => void;
  isFiltering?: boolean;
  showFilters?: boolean;
  onToggleFilters?: () => void;
  setView?: (view: "discover" | "collection" | "profile" | "for-artists") => void;
}

export function UniversalAppHeader({ 
  currentPage,
  collectionCount = 0,
  onFilterChange,
  onClearFilters,
  isFiltering = false,
  showFilters = false,
  onToggleFilters,
  setView
}: UniversalAppHeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const pathname = usePathname();

  // User authentication is handled by parent component (page.tsx)
  // No need for duplicate auth listeners here

  const handleNavigation = (path: string, view?: "discover" | "collection" | "profile" | "for-artists") => {
    if (setView && view) {
      // Use setView for main app navigation (no page reload)
      setView(view);
    } else {
      // Use router.push for standalone pages
      router.push(path, { scroll: false });
    }
    setIsMobileMenuOpen(false);
  };

  const isSelected = (page: string) => {
    if (currentPage) {
      return currentPage === page;
    }
    // Auto-detect current page from pathname
    if (pathname === "/" || pathname.includes("?view=discover")) return page === "discover";
    if (pathname === "/collection") return page === "collection";
    if (pathname === "/profile") return page === "profile";
    if (pathname === "/for-artists") return page === "for-artists";
    if (pathname === "/about") return page === "about";
    if (pathname === "/contact") return page === "contact";
    return false;
  };

  return (
    <header className="border-b bg-background relative app-header z-10">
      <div className="flex items-center justify-between p-4 md:p-6">
        {/* Logo */}
        <div className="flex items-center">
          <Button
            variant="ghost"
            className="font-serif text-xl font-semibold text-black"
            onClick={() => handleNavigation("/", "discover")}
          >
            Kaleidorium
          </Button>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <Button
            variant="ghost"
            className={`text-sm ${isSelected("discover") ? "bg-gray-100" : ""}`}
            onClick={() => handleNavigation("/", "discover")}
          >
            <Palette className="w-4 h-4 mr-1" />
            Discover
          </Button>

          {/* Filter Button - Only show on discover page */}
          {(isSelected("discover") || pathname === "/") && onToggleFilters && (
            <Button
              variant="ghost"
              className={`text-sm ${showFilters ? "bg-gray-100" : ""} ${isFiltering ? "text-blue-600" : ""}`}
              onClick={onToggleFilters}
            >
              <Search className="w-4 h-4 mr-1" />
              Filters
              {isFiltering && <span className="ml-2 w-2 h-2 bg-blue-600 rounded-full"></span>}
            </Button>
          )}

          <Button
            variant="ghost"
            className={`text-sm relative ${isSelected("collection") ? "bg-gray-100" : ""}`}
            onClick={() => handleNavigation("/collection")}
          >
            <Heart className="w-4 h-4 mr-1" />
            Collection ({collectionCount})
          </Button>

          <Button
            variant="ghost"
            className={`text-sm ${isSelected("for-artists") ? "bg-gray-100" : ""}`}
            onClick={() => handleNavigation("/for-artists")}
          >
            <Palette className="w-4 h-4 mr-1" />
            For Artists
          </Button>

          <Button
            variant="ghost"
            className={`text-sm ${isSelected("about") ? "bg-gray-100" : ""}`}
            onClick={() => handleNavigation("/about")}
          >
            <Info className="w-4 h-4 mr-1" />
            For Collectors
          </Button>

          <Button
            variant="ghost"
            className={`text-sm ${isSelected("contact") ? "bg-gray-100" : ""}`}
            onClick={() => handleNavigation("/contact")}
          >
            <Mail className="w-4 h-4 mr-1" />
            Contact
          </Button>

          {user ? (
            <Button
              variant="ghost"
              className={`text-sm ${isSelected("profile") ? "bg-gray-100" : ""}`}
              onClick={() => handleNavigation("/profile")}
            >
              <User className="w-4 h-4 mr-1" />
              Profile
            </Button>
          ) : (
            <Button
              variant="ghost"
              className="text-sm"
              onClick={() => handleNavigation("/login")}
            >
              <User className="w-4 h-4 mr-1" />
              Sign In
            </Button>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="sm"
          className="md:hidden"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t bg-background absolute w-full z-[60] shadow-lg">
          <div className="flex flex-col space-y-2 p-4">
            <Button
              variant="ghost"
              className={`justify-start ${isSelected("discover") ? "bg-gray-100" : ""}`}
              onClick={() => handleNavigation("/", "discover")}
            >
              <Palette className="w-4 h-4 mr-2" />
              Discover
            </Button>

            {/* Mobile Filter Button - Only show on discover page */}
            {(isSelected("discover") || pathname === "/") && onToggleFilters && (
              <Button
                variant="ghost"
                className={`justify-start ${showFilters ? "bg-gray-100" : ""} ${isFiltering ? "text-blue-600" : ""}`}
                onClick={onToggleFilters}
              >
                <Search className="w-4 h-4 mr-2" />
                Filters
                {isFiltering && <span className="ml-2 w-2 h-2 bg-blue-600 rounded-full"></span>}
              </Button>
            )}

            <Button
              variant="ghost"
              className={`justify-start ${isSelected("collection") ? "bg-gray-100" : ""}`}
              onClick={() => handleNavigation("/collection")}
            >
              <Heart className="w-4 h-4 mr-2" />
              Collection ({collectionCount})
            </Button>

            <Button
              variant="ghost"
              className={`justify-start ${isSelected("for-artists") ? "bg-gray-100" : ""}`}
              onClick={() => handleNavigation("/for-artists")}
            >
              <Palette className="w-4 h-4 mr-2" />
              For Artists
            </Button>

            <Button
              variant="ghost"
              className={`justify-start ${isSelected("about") ? "bg-gray-100" : ""}`}
              onClick={() => handleNavigation("/about")}
            >
              <Info className="w-4 h-4 mr-2" />
              For Collectors
            </Button>

            <Button
              variant="ghost"
              className={`justify-start ${isSelected("contact") ? "bg-gray-100" : ""}`}
              onClick={() => handleNavigation("/contact")}
            >
              <Mail className="w-4 h-4 mr-2" />
              Contact
            </Button>

            {user ? (
              <Button
                variant="ghost"
                className={`justify-start ${isSelected("profile") ? "bg-gray-100" : ""}`}
                onClick={() => handleNavigation("/profile")}
              >
                <User className="w-4 h-4 mr-2" />
                Profile
              </Button>
            ) : (
              <Button
                variant="ghost"
                className="justify-start"
                onClick={() => handleNavigation("/login")}
              >
                <User className="w-4 h-4 mr-2" />
                Sign In
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
