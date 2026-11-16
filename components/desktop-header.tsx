"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Heart, User, Palette, Info, Mail, BadgeAlert, Sparkles, Search, Building2 } from "lucide-react";
import { KaleidoriumWordmark } from "@/components/kaleidorium-wordmark";

// Desktop header props interface - supports terms and privacy pages
interface DesktopHeaderProps {
  currentPage?: "discover" | "collection" | "featured" | "taste-profile" | "profile" | "why-kaleidorium" | "for-artists" | "for-galleries" | "about" | "contact" | "pricing" | "login" | "register" | "terms" | "privacy";
  collectionCount?: number;
  setView: (view: "discover" | "collection" | "featured" | "taste-profile" | "profile" | "why-kaleidorium" | "for-artists" | "for-galleries" | "about" | "contact" | "pricing" | "terms" | "privacy") => void;
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
  const [audience, setAudience] = useState<"artist" | "gallery" | null>(null);
  const router = useRouter();

  const isSelected = (view: string) => currentPage === view;

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

  // "How it works?" stays active on the shared page. Artist and gallery landings have their own items.
  const isWhySelected = () =>
    !audience &&
    (currentPage === "why-kaleidorium" || currentPage === "about");

  const handleNavigation = (view: "discover" | "collection" | "profile" | "why-kaleidorium" | "for-artists" | "for-galleries" | "about" | "contact" | "pricing") => {
    if (view === "discover" && (window as any).clearArtDiscoveryFilters) {
      (window as any).clearArtDiscoveryFilters();
    }
    if (view === "discover" && onClearFilters) {
      onClearFilters();
    }
    setAudience(null);
    setView(view);
    setShowMenu(false);
  };

  const openAudience = (role: "artist" | "gallery") => {
    setAudience(role);
    setShowMenu(false);
    router.push(`/?view=why-kaleidorium&role=${role}`);
  };

  const handleLogoClick = () => {
    handleNavigation("discover");
    router.push("/", { scroll: false });
  };

  const handleSearchClick = () => {
    if (typeof window !== "undefined" && (window as any).openGlobalArtworkSearch) {
      (window as any).openGlobalArtworkSearch();
    }
  };

  const navLinkClass = (active: boolean) =>
    `desktop-nav-link${active ? " desktop-nav-link--active" : ""}`;

  const utilityIconClass = "desktop-nav-icon-btn";

  return (
    <header className="bg-white border-b border-[#E8E8E6] relative app-header z-[110]">
      <div className="flex items-center gap-3 px-4 lg:px-6 min-h-[64px] py-2">

        {/* Logo */}
        <button
          onClick={handleLogoClick}
          className="flex items-center flex-shrink-0 cursor-pointer z-10
                     focus-visible:outline-none focus-visible:ring-2
                     focus-visible:ring-[#D9CFF7] rounded-[6px]"
          aria-label="Kaleidorium — go to Discover"
        >
          <KaleidoriumWordmark size="desktop" />
        </button>

        {/* Centered navigation */}
        <nav className="desktop-nav hidden md:flex flex-1 flex-wrap items-center justify-center gap-x-3 gap-y-1 lg:gap-x-5 xl:gap-x-6">
          <button
            type="button"
            className={navLinkClass(isSelected("discover"))}
            onClick={() => handleNavigation("discover")}
          >
            Discover
          </button>

          <button
            type="button"
            className={navLinkClass(isSelected("collection"))}
            onClick={() => handleNavigation("collection")}
          >
            Collection ({collectionCount})
          </button>

          <button
            type="button"
            className={navLinkClass(isSelected("taste-profile"))}
            onClick={() => {
              setShowMenu(false);
              router.push("/taste-profile");
            }}
          >
            Taste Profile
          </button>

          <button
            type="button"
            className={navLinkClass(isSelected("featured"))}
            onClick={() => {
              setShowMenu(false);
              router.push("/featured");
            }}
          >
            Featured
          </button>

          <button
            type="button"
            className={navLinkClass(isWhySelected())}
            onClick={() => handleNavigation("why-kaleidorium")}
          >
            How it works?
          </button>

          <button
            type="button"
            className={navLinkClass(audience === "artist")}
            onClick={() => openAudience("artist")}
          >
            For Artists
          </button>

          <button
            type="button"
            className={navLinkClass(audience === "gallery")}
            onClick={() => openAudience("gallery")}
          >
            For Galleries
          </button>
        </nav>

        {/* Utility icons */}
        <div className="hidden md:flex items-center gap-1 z-10 flex-shrink-0">
          <button
            type="button"
            className={utilityIconClass}
            onClick={handleSearchClick}
            aria-label="Open search"
          >
            <Search className="w-[18px] h-[18px]" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            className={utilityIconClass}
            onClick={() => handleNavigation("profile")}
            aria-label="Account"
          >
            <User className="w-[18px] h-[18px]" strokeWidth={1.75} />
          </button>
        </div>
      </div>

      {/* ── Mobile fallback menu (unchanged — primary mobile nav is new-mobile-header) */}
      {showMenu && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-50">
            <Button variant="ghost" className="mobile-menu-btn w-full"
              onClick={() => handleNavigation("discover")}>
              <Palette className="mr-3 h-5 w-5" />Discover
            </Button>
            <Button variant="ghost" className="mobile-menu-btn w-full"
              onClick={() => handleNavigation("collection")}>
              <Heart className="mr-3 h-5 w-5" />Collection ({collectionCount})
            </Button>
            <Button variant="ghost" className="mobile-menu-btn w-full"
              onClick={() => { setShowMenu(false); router.push("/taste-profile"); }}>
              <Sparkles className="mr-3 h-5 w-5" />Taste Profile
            </Button>
            <Button variant="ghost" className="mobile-menu-btn w-full"
              onClick={() => { setShowMenu(false); router.push("/featured"); }}>
              <BadgeAlert className="mr-3 h-5 w-5" />Featured
            </Button>
            <Button variant="ghost" className="mobile-menu-btn w-full"
              onClick={() => handleNavigation("why-kaleidorium")}>
              <Info className="mr-3 h-5 w-5" />How it works?
            </Button>
            <Button variant="ghost" className="mobile-menu-btn w-full"
              onClick={() => openAudience("artist")}>
              <Palette className="mr-3 h-5 w-5" />For Artists
            </Button>
            <Button variant="ghost" className="mobile-menu-btn w-full"
              onClick={() => openAudience("gallery")}>
              <Building2 className="mr-3 h-5 w-5" />For Galleries
            </Button>
            <Button variant="ghost" className="mobile-menu-btn w-full"
              onClick={() => handleNavigation("contact")}>
              <Mail className="mr-3 h-5 w-5" />Contact
            </Button>
            <Button variant="ghost" className="mobile-menu-btn w-full"
              onClick={() => handleNavigation("profile")}>
              <User className="mr-3 h-5 w-5" />Account
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
