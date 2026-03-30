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

  // ── shared class helpers ───────────────────────────────────────────────────

  /** Plain text nav item — no border, transparent bg, refined hover */
  const plainNavItem = (active: boolean) =>
    `inline-flex items-center gap-1.5 h-9 px-3 text-[13.5px] font-medium rounded-[8px]
     transition-colors duration-150 cursor-pointer select-none
     ${active
       ? "text-[#1E1E1C] bg-[#F5F4F1]"
       : "text-[#5F5F5A] hover:text-[#1E1E1C] hover:bg-[#FAFAF8]"
     }`;

  /** Soft pill nav item — used only for Collection (count-based / stateful) */
  const pillNavItem = (active: boolean) =>
    `inline-flex items-center gap-1.5 h-9 px-4 text-[13.5px] rounded-[14px] border
     transition-colors duration-150 cursor-pointer select-none ml-1
     ${active
       ? "bg-[#F5F4F1] border-[#E6E4DF] text-[#1E1E1C] font-semibold"
       : "bg-white border-[#EAE7E1] text-[#4A4A45] font-medium hover:bg-[#FAFAF8] hover:border-[#E6E4DF] hover:text-[#1E1E1C]"
     }`;

  return (
    /*
     * Desktop header only — rendered exclusively on md+ breakpoints via page.tsx.
     * bg-white + hairline border replaces the old grey bg-background band.
     */
    <header className="bg-white border-b border-[#F0EEE9] relative app-header z-[110]">
      <div className="flex items-center justify-between px-6 h-[64px]">

        {/* ── Logo — bare brand signature ─────────────────────────────────── */}
        {/*
         * The logo sits directly on the white header as a masthead / wordmark.
         * No ghost button container, no border, no pill.
         * A plain <button> preserves click behaviour and keyboard accessibility
         * without any visual chrome.
         */}
        <button
          onClick={handleLogoClick}
          className="flex items-center flex-shrink-0 cursor-pointer
                     focus-visible:outline-none focus-visible:ring-2
                     focus-visible:ring-[#D9CFF7] rounded-[6px]"
          aria-label="Kaleidorium — go to Discover"
        >
          <img
            src="/logos/kaleidorium-wordmark-desktop.png"
            alt="Kaleidorium"
            className="h-8 md:h-9 w-auto flex-shrink-0"
          />
        </button>

        {/* ── Desktop Navigation ───────────────────────────────────────────── */}
        <nav className="hidden md:flex items-center gap-0.5">

          {/* 1. Discover */}
          <button
            className={plainNavItem(isSelected("discover"))}
            onClick={() => handleNavigation("discover")}
          >
            <Palette className="w-3.5 h-3.5 flex-shrink-0" />
            Discover
          </button>

          {/* 2. Collection — soft pill (dynamic count, stateful) */}
          <button
            className={pillNavItem(isSelected("collection"))}
            onClick={() => handleNavigation("collection")}
          >
            <Heart className="w-3.5 h-3.5 flex-shrink-0" />
            Collection ({collectionCount})
          </button>

          {/* 3. Why Kaleidorium? */}
          <button
            className={`${plainNavItem(isWhySelected())} ml-1`}
            onClick={() => handleNavigation("why-kaleidorium")}
          >
            <Info className="w-3.5 h-3.5 flex-shrink-0" />
            Why Kaleidorium?
          </button>

          {/* 4. Pricing */}
          <button
            className={plainNavItem(isSelected("pricing"))}
            onClick={() => handleNavigation("pricing")}
          >
            <DollarSign className="w-3.5 h-3.5 flex-shrink-0" />
            Pricing
          </button>

          {/* 5. Contact */}
          <button
            className={plainNavItem(isSelected("contact"))}
            onClick={() => handleNavigation("contact")}
          >
            <Mail className="w-3.5 h-3.5 flex-shrink-0" />
            Contact
          </button>

          {/* 6. Account — plain item, right edge anchor */}
          <button
            className={`${plainNavItem(isSelected("profile"))} ml-1`}
            onClick={() => handleNavigation("profile")}
          >
            <User className="w-3.5 h-3.5 flex-shrink-0" />
            Account
          </button>

        </nav>
      </div>

      {/* ── Mobile fallback menu (unchanged — primary mobile nav is new-mobile-header) */}
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
