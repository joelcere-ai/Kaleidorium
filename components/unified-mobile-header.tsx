"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Menu, User, Search, Heart, Palette, Info, Mail } from "lucide-react";

interface UnifiedMobileHeaderProps {
  currentPage?: "discover" | "collection" | "for-artists" | "about" | "contact" | "profile";
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
        <Button
          variant="ghost"
          onClick={handleLogoClick}
          className="flex items-center space-x-1 text-black hover:bg-gray-100 px-2"
        >
            <img 
              src="/logos/logo-desktop-32x32-v3.svg" 
              alt="Kaleidorium Logo" 
              className="w-6 h-6"
            />
          <span className="font-serif text-xl font-semibold text-black">Kaleidorium</span>
        </Button>
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
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-end justify-center">
          <div className="bg-white w-full max-w-md rounded-t-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-black">Menu</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowMenuModal(false)}
                className="text-black hover:bg-gray-100"
              >
                ×
              </Button>
            </div>
            <div className="space-y-3">
              <Button
                variant="ghost"
                className={`w-full justify-start text-black hover:bg-gray-100 ${
                  currentPage === "discover" ? "bg-gray-100" : ""
                }`}
                onClick={() => handleNavigation("/")}
              >
                <Search className="mr-3 h-5 w-5" />
                Discover
              </Button>
              
              <Button
                variant="ghost"
                className={`w-full justify-start text-black hover:bg-gray-100 ${
                  currentPage === "collection" ? "bg-gray-100" : ""
                }`}
                onClick={() => handleNavigation("/collection")}
              >
                <Heart className="mr-3 h-5 w-5" />
                My Collection
              </Button>
              
              <Button
                variant="ghost"
                className={`w-full justify-start text-black hover:bg-gray-100 ${
                  currentPage === "for-artists" ? "bg-gray-100" : ""
                }`}
                onClick={() => handleNavigation("/for-artists")}
              >
                <Palette className="mr-3 h-5 w-5" />
                For Artists
              </Button>
              
              <Button
                variant="ghost"
                className={`w-full justify-start text-black hover:bg-gray-100 ${
                  currentPage === "about" ? "bg-gray-100" : ""
                }`}
                onClick={() => handleNavigation("/?view=about")}
              >
                <Info className="mr-3 h-5 w-5" />
                For Collectors
              </Button>
              
              <Button
                variant="ghost"
                className={`w-full justify-start text-black hover:bg-gray-100 ${
                  currentPage === "contact" ? "bg-gray-100" : ""
                }`}
                onClick={() => handleNavigation("/contact")}
              >
                <Mail className="mr-3 h-5 w-5" />
                Contact
              </Button>
              
              <Button
                variant="ghost"
                className={`w-full justify-start text-black hover:bg-gray-100 ${
                  currentPage === "profile" ? "bg-gray-100" : ""
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
                  className="w-full text-left text-sm text-gray-600 hover:text-gray-800 py-2"
                  onClick={() => handleNavigation("/terms")}
                >
                  Terms of Service
                </button>
                <button
                  className="w-full text-left text-sm text-gray-600 hover:text-gray-800 py-2"
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
