"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Menu, User, Search, Heart, Info, Mail, DollarSign } from "lucide-react";
import { KaleidoriumWordmark } from "@/components/kaleidorium-wordmark";

interface UnifiedMobileHeaderProps {
  currentPage?: "discover" | "collection" | "why-kaleidorium" | "for-artists" | "for-galleries" | "about" | "contact" | "pricing" | "profile";
}

export function UnifiedMobileHeader({ currentPage }: UnifiedMobileHeaderProps) {
  const [showMenuModal, setShowMenuModal] = useState(false);
  const router = useRouter();

  const handleNavigation = (path: string) => {
    router.push(path);
    setShowMenuModal(false);
  };

  const handleLogoClick = () => {
    handleNavigation("/");
  };

  return (
    <>
      {/* Mobile Header - Always Visible */}
      <div className="flex justify-between items-center p-4 bg-white border-b border-gray-200 sticky top-0 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowMenuModal(true)}
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
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleNavigation("/profile")}
          className="text-black hover:bg-gray-100"
        >
          <User className="w-6 h-6" />
        </Button>
      </div>

      {/* Mobile Menu Modal */}
      {showMenuModal && (
        <div className="mobile-menu-overlay bg-black/50 z-[60] justify-center">
          <div className="bg-white w-full max-w-md rounded-t-2xl mobile-menu-drawer">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-black">Menu</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowMenuModal(false)}
                className="mobile-menu-close-btn text-black"
              >
                ×
              </Button>
            </div>
            <div className="space-y-3">
              <Button
                variant="ghost"
                className={`mobile-menu-btn w-full ${
                  currentPage === "discover" ? "font-semibold underline" : ""
                }`}
                onClick={() => handleNavigation("/")}
              >
                <Search className="mr-3 h-5 w-5" />
                Discover
              </Button>
              
              <Button
                variant="ghost"
                className={`mobile-menu-btn w-full ${
                  currentPage === "collection" ? "font-semibold underline" : ""
                }`}
                onClick={() => handleNavigation("/collection")}
              >
                <Heart className="mr-3 h-5 w-5" />
                My Collection
              </Button>
              
              <Button
                variant="ghost"
                className={`mobile-menu-btn w-full ${
                  currentPage === "why-kaleidorium" ? "font-semibold underline" : ""
                }`}
                onClick={() => handleNavigation("/?view=why-kaleidorium")}
              >
                <Info className="mr-3 h-5 w-5" />
                How it works?
              </Button>

              <Button
                variant="ghost"
                className={`mobile-menu-btn w-full ${
                  currentPage === "pricing" ? "font-semibold underline" : ""
                }`}
                onClick={() => handleNavigation("/pricing")}
              >
                <DollarSign className="mr-3 h-5 w-5" />
                Pricing
              </Button>
              
              <Button
                variant="ghost"
                className={`mobile-menu-btn w-full ${
                  currentPage === "contact" ? "font-semibold underline" : ""
                }`}
                onClick={() => handleNavigation("/contact")}
              >
                <Mail className="mr-3 h-5 w-5" />
                Contact
              </Button>
              
              <Button
                variant="ghost"
                className={`mobile-menu-btn w-full ${
                  currentPage === "profile" ? "font-semibold underline" : ""
                }`}
                onClick={() => handleNavigation("/profile")}
              >
                <User className="mr-3 h-5 w-5" />
                Profile
              </Button>
            </div>
            
            {/* Footer Links */}
            <div className="border-t border-gray-200 mt-4 pt-4">
              <div className="space-y-2">
                <button
                  className="mobile-menu-footer-link"
                  onClick={() => handleNavigation("/terms")}
                >
                  Terms of Service
                </button>
                <button
                  className="mobile-menu-footer-link"
                  onClick={() => handleNavigation("/privacy")}
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
