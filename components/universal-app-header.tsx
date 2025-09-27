"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Menu, X, User, Search, Heart, Palette, Info, Mail, AtSign } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface UniversalAppHeaderProps {
  currentPage?: "discover" | "collection" | "profile" | "for-artists" | "about" | "contact";
  collectionCount?: number;
  onFilterChange?: (filters: any) => void;
  onClearFilters?: () => void;
  isFiltering?: boolean;
  showFilters?: boolean;
  onToggleFilters?: () => void;
}

export function UniversalAppHeader({ 
  currentPage,
  collectionCount = 0,
  onFilterChange,
  onClearFilters,
  isFiltering = false,
  showFilters = false,
  onToggleFilters
}: UniversalAppHeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleNavigation = (path: string) => {
    router.push(path);
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
    if (pathname.includes("?view=about")) return page === "about";
    if (pathname === "/contact") return page === "contact";
    return false;
  };

  return (
    <header className="border-b bg-background sticky top-0 z-50 relative">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Logo */}
        <div className="flex items-center">
          <h1 className="text-xl font-bold">Kaleidorium</h1>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-4">
          <Button
            variant="ghost"
            className={`text-sm ${isSelected("discover") ? "bg-gray-100" : ""}`}
            onClick={() => handleNavigation("/")}
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
            className={`text-sm ${isSelected("collection") ? "bg-gray-100" : ""}`}
            onClick={() => handleNavigation("/collection")}
          >
            <Heart className="w-4 h-4 mr-1" />
            Collection
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
            onClick={() => handleNavigation("/?view=about")}
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
        <div className="md:hidden border-t bg-background absolute w-full z-50 shadow-lg">
          <div className="flex flex-col space-y-2 p-4">
            <Button
              variant="ghost"
              className={`justify-start ${isSelected("discover") ? "bg-gray-100" : ""}`}
              onClick={() => handleNavigation("/")}
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
              Collection
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
              onClick={() => handleNavigation("/?view=about")}
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
