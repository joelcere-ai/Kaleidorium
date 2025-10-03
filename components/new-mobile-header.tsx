"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Menu, X, User, Search, Heart, Palette, Info, Mail } from "lucide-react";
import { useNavigation } from "@/components/navigation-context";

interface NewMobileHeaderProps {
  currentPage?: string;
  collectionCount?: number;
}

export function NewMobileHeader({ currentPage, collectionCount = 0 }: NewMobileHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { navigateToView } = useNavigation();

  const handleNavigation = (view: "discover" | "collection" | "profile" | "for-artists" | "about" | "contact") => {
    console.log('🚀 NewMobileHeader: Navigating to:', view);
    navigateToView(view);
    setIsMenuOpen(false);
  };

  const isCurrentPage = (page: string) => {
    // Use standalone routes for consistent navigation
    if (page === "discover" && pathname === "/") return true;
    if (page === "collection" && pathname === "/collection") return true;
    if (page === "profile" && pathname === "/profile") return true;
    if (page === "for-artists" && pathname === "/for-artists") return true;
    if (page === "about" && pathname === "/about") return true;
    if (page === "contact" && pathname === "/contact") return true;
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

          {/* Logo */}
          <h1 className="font-serif text-xl font-semibold text-black">Kaleidorium</h1>

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
        <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-end">
          <div className="bg-white w-full rounded-t-2xl p-6">
            {/* Close Button */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-black">Menu</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMenuOpen(false)}
                className="text-black hover:bg-gray-100"
              >
                <X className="w-6 h-6" />
              </Button>
            </div>

            {/* Navigation Items */}
            <div className="space-y-3">
              <Button
                variant="ghost"
                className={`w-full justify-start text-black hover:bg-gray-100 ${
                  isCurrentPage("discover") ? "bg-gray-100" : ""
                }`}
                onClick={() => handleNavigation("discover")}
              >
                <Search className="mr-3 h-5 w-5" />
                Discover
              </Button>

              <Button
                variant="ghost"
                className={`w-full justify-start text-black hover:bg-gray-100 ${
                  isCurrentPage("collection") ? "bg-gray-100" : ""
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
                className={`w-full justify-start text-black hover:bg-gray-100 ${
                  isCurrentPage("for-artists") ? "bg-gray-100" : ""
                }`}
                onClick={() => handleNavigation("for-artists")}
              >
                <Palette className="mr-3 h-5 w-5" />
                For Artists
              </Button>

              <Button
                variant="ghost"
                className={`w-full justify-start text-black hover:bg-gray-100 ${
                  isCurrentPage("about") ? "bg-gray-100" : ""
                }`}
                onClick={() => handleNavigation("about")}
              >
                <Info className="mr-3 h-5 w-5" />
                For Collectors
              </Button>

              <Button
                variant="ghost"
                className={`w-full justify-start text-black hover:bg-gray-100 ${
                  isCurrentPage("contact") ? "bg-gray-100" : ""
                }`}
                onClick={() => handleNavigation("contact")}
              >
                <Mail className="mr-3 h-5 w-5" />
                Contact
              </Button>

              <Button
                variant="ghost"
                className={`w-full justify-start text-black hover:bg-gray-100 ${
                  isCurrentPage("profile") ? "bg-gray-100" : ""
                }`}
                onClick={() => handleNavigation("profile")}
              >
                <User className="mr-3 h-5 w-5" />
                Profile
              </Button>
            </div>

            {/* Footer Links */}
            <div className="border-t border-gray-200 mt-6 pt-4">
              <div className="space-y-2">
                <button
                  className="w-full text-left text-sm text-gray-600 hover:text-gray-800 py-2"
                  onClick={() => {
                    router.push("/terms");
                    setIsMenuOpen(false);
                  }}
                >
                  Terms of Service
                </button>
                <button
                  className="w-full text-left text-sm text-gray-600 hover:text-gray-800 py-2"
                  onClick={() => {
                    router.push("/privacy");
                    setIsMenuOpen(false);
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
