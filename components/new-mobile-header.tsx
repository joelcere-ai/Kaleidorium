"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Menu, X, User, Search, Heart, Palette, Info, Mail, BadgeAlert, Sparkles, Building2 } from "lucide-react";
import { KaleidoriumWordmark } from "@/components/kaleidorium-wordmark";

interface NewMobileHeaderProps {
  currentPage?: string;
  collectionCount?: number;
  setView: (view: "discover" | "collection" | "featured" | "taste-profile" | "profile" | "why-kaleidorium" | "for-artists" | "for-galleries" | "about" | "contact" | "pricing" | "terms" | "privacy") => void;
}

export function NewMobileHeader({ currentPage, collectionCount = 0, setView }: NewMobileHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [audience, setAudience] = useState<"artist" | "gallery" | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const role = params.get("role");
    const onWhyPage = currentPage === "why-kaleidorium" || params.get("view") === "why-kaleidorium";
    if (currentPage === "for-artists" || (onWhyPage && role === "artist")) {
      setAudience("artist");
    } else if (currentPage === "for-galleries" || (onWhyPage && role === "gallery")) {
      setAudience("gallery");
    } else {
      setAudience(null);
    }
  }, [currentPage]);

  const handleNavigation = (view: "discover" | "collection" | "profile" | "why-kaleidorium" | "for-artists" | "for-galleries" | "about" | "contact" | "pricing" | "terms" | "privacy") => {
    if (view === "discover" && (window as any).clearArtDiscoveryFilters) {
      (window as any).clearArtDiscoveryFilters();
    }
    setAudience(null);
    setView(view);
    setIsMenuOpen(false);
  };

  const openAudience = (role: "artist" | "gallery") => {
    setAudience(role);
    setIsMenuOpen(false);
    router.push(`/?view=why-kaleidorium&role=${role}`);
  };

  const handleLogoClick = () => {
    handleNavigation("discover");
    router.push("/", { scroll: false });
  };

  const isCurrentPage = (page: string) => {
    // Use standalone routes for consistent navigation
    if (page === "discover" && pathname === "/") return true;
    if (page === "collection" && pathname === "/collection") return true;
    if (page === "profile" && pathname === "/profile") return true;
    if (page === "for-artists" && (pathname === "/for-artists" || pathname.startsWith("/for-artists/"))) return true;
    if (page === "for-galleries" && (pathname === "/for-galleries" || pathname.startsWith("/for-galleries/"))) return true;
    if (page === "about" && pathname === "/about") return true;
    if (page === "contact" && pathname === "/contact") return true;
    if (page === "featured" && pathname === "/featured") return true;
    if (page === "taste-profile" && pathname === "/taste-profile") return true;
    return false;
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50 mobile-header">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Hamburger Menu */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMenuOpen(true)}
            className="text-black hover:bg-gray-100"
          >
            <Menu className="w-6 h-6" />
          </Button>

          {/* Logo — bare brand signature, no button chrome */}
          <button
            onClick={handleLogoClick}
            className="flex items-center flex-shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D9CFF7] rounded-[6px]"
            aria-label="Kaleidorium — go to Discover"
          >
            <KaleidoriumWordmark size="mobile" />
          </button>

          {/* Profile Icon */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleNavigation("profile")}
            className="text-black hover:bg-gray-100"
          >
            <User className="w-6 h-6" />
          </Button>
        </div>
      </div>

      {/* Mobile Menu Modal */}
      {isMenuOpen && (
        <div className="mobile-menu-overlay md:hidden bg-black/50 z-[60]">
          <div className="bg-white w-full rounded-t-2xl mobile-menu-drawer">
            {/* Close Button */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-black">Menu</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMenuOpen(false)}
                className="mobile-menu-close-btn text-black"
              >
                <X className="w-6 h-6" />
              </Button>
            </div>

            {/* Navigation Items */}
            <div className="space-y-3">
              <Button
                variant="ghost"
                className={`mobile-menu-btn w-full ${
                  isCurrentPage("discover") ? "font-semibold underline" : ""
                }`}
                onClick={() => handleNavigation("discover")}
              >
                <Search className="mr-3 h-5 w-5" />
                Discover
              </Button>

              <Button
                variant="ghost"
                className={`mobile-menu-btn w-full ${
                  isCurrentPage("collection") ? "font-semibold underline" : ""
                }`}
                onClick={() => handleNavigation("collection")}
              >
                <Heart className="mr-3 h-5 w-5" />
                My Collection
                {collectionCount > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                    {collectionCount}
                  </span>
                )}
              </Button>

              <Button
                variant="ghost"
                className={`mobile-menu-btn w-full ${
                  isCurrentPage("taste-profile") ? "font-semibold underline" : ""
                }`}
                onClick={() => {
                  setIsMenuOpen(false);
                  router.push("/taste-profile");
                }}
              >
                <Sparkles className="mr-3 h-5 w-5" />
                Taste Profile
              </Button>

              <Button
                variant="ghost"
                className={`mobile-menu-btn w-full ${
                  isCurrentPage("featured") ? "font-semibold underline" : ""
                }`}
                onClick={() => {
                  setIsMenuOpen(false);
                  router.push("/featured");
                }}
              >
                <BadgeAlert className="mr-3 h-5 w-5" />
                Featured
              </Button>

              <Button
                variant="ghost"
                className={`mobile-menu-btn w-full ${
                  !audience && (isCurrentPage("why-kaleidorium") || isCurrentPage("about") || currentPage === "why-kaleidorium" || currentPage === "about") ? "font-semibold underline" : ""
                }`}
                onClick={() => handleNavigation("why-kaleidorium")}
              >
                <Info className="mr-3 h-5 w-5" />
                How it works?
              </Button>

              <Button
                variant="ghost"
                className={`mobile-menu-btn w-full ${
                  audience === "artist" || isCurrentPage("for-artists") ? "font-semibold underline" : ""
                }`}
                onClick={() => openAudience("artist")}
              >
                <Palette className="mr-3 h-5 w-5" />
                For Artists
              </Button>

              <Button
                variant="ghost"
                className={`mobile-menu-btn w-full ${
                  audience === "gallery" || isCurrentPage("for-galleries") ? "font-semibold underline" : ""
                }`}
                onClick={() => openAudience("gallery")}
              >
                <Building2 className="mr-3 h-5 w-5" />
                For Galleries
              </Button>

              <Button
                variant="ghost"
                className={`mobile-menu-btn w-full ${
                  isCurrentPage("contact") ? "font-semibold underline" : ""
                }`}
                onClick={() => handleNavigation("contact")}
              >
                <Mail className="mr-3 h-5 w-5" />
                Contact
              </Button>

              <Button
                variant="ghost"
                className={`mobile-menu-btn w-full ${
                  isCurrentPage("profile") ? "font-semibold underline" : ""
                }`}
                onClick={() => handleNavigation("profile")}
              >
                <User className="mr-3 h-5 w-5" />
                Account
              </Button>
            </div>

            {/* Footer Links */}
            <div className="border-t border-gray-200 mt-6 pt-4">
              <div className="space-y-2">
                <button
                  className="mobile-menu-footer-link"
                  onClick={() => {
                    handleNavigation("terms");
                  }}
                >
                  Terms of Service
                </button>
                <button
                  className="mobile-menu-footer-link"
                  onClick={() => {
                    handleNavigation("privacy");
                  }}
                >
                  Privacy & Data Policy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
