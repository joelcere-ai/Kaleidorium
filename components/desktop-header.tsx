"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Search, Heart, User, Palette, Info, Mail } from "lucide-react";

interface DesktopHeaderProps {
  currentPage?: "discover" | "collection" | "profile" | "for-artists" | "about" | "contact" | "login" | "register";
  collectionCount?: number;
}

export function DesktopHeader({ currentPage, collectionCount = 0 }: DesktopHeaderProps) {
  const [showMenu, setShowMenu] = useState(false);
  const router = useRouter();

  const isSelected = (view: string) => currentPage === view;

  const handleNavigation = (path: string) => {
    router.push(path, { scroll: false });
    setShowMenu(false);
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Button
              variant="ghost"
              className="font-serif text-xl font-semibold tracking-wide text-black hover:text-gray-600"
              onClick={() => handleNavigation("/?view=discover")}
            >
              Kaleidorium
            </Button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Button
              variant="ghost"
              className={`text-sm ${isSelected("discover") ? "bg-gray-100" : ""}`}
              onClick={() => handleNavigation("/?view=discover")}
            >
              <Search className="mr-2 h-4 w-4" />
              Discover
            </Button>
            
            <Button
              variant="ghost"
              className={`text-sm ${isSelected("collection") ? "bg-gray-100" : ""}`}
              onClick={() => handleNavigation("/collection")}
            >
              <Heart className="mr-2 h-4 w-4" />
              Collection ({collectionCount})
            </Button>
            
            <Button
              variant="ghost"
              className={`text-sm ${isSelected("for-artists") ? "bg-gray-100" : ""}`}
              onClick={() => handleNavigation("/for-artists")}
            >
              <Palette className="mr-2 h-4 w-4" />
              For Artists
            </Button>
            
            <Button
              variant="ghost"
              className={`text-sm ${isSelected("about") ? "bg-gray-100" : ""}`}
              onClick={() => handleNavigation("/?view=about")}
            >
              <Info className="mr-2 h-4 w-4" />
              For Collectors
            </Button>
            
            <Button
              variant="ghost"
              className={`text-sm ${isSelected("contact") ? "bg-gray-100" : ""}`}
              onClick={() => handleNavigation("/contact")}
            >
              <Mail className="mr-2 h-4 w-4" />
              Contact
            </Button>
          </nav>

          {/* Right side - Profile/Login */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              className={`text-sm ${isSelected("profile") ? "bg-gray-100" : ""}`}
              onClick={() => handleNavigation("/profile")}
            >
              <User className="mr-2 h-4 w-4" />
              Profile
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu - Hidden on desktop but kept for responsive design */}
      {showMenu && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-50">
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-700 hover:text-gray-900"
              onClick={() => handleNavigation("/?view=discover")}
            >
              <Search className="mr-3 h-5 w-5" />
              Discover
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-700 hover:text-gray-900"
              onClick={() => handleNavigation("/collection")}
            >
              <Heart className="mr-3 h-5 w-5" />
              Collection ({collectionCount})
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-700 hover:text-gray-900"
              onClick={() => handleNavigation("/for-artists")}
            >
              <Palette className="mr-3 h-5 w-5" />
              For Artists
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-700 hover:text-gray-900"
              onClick={() => handleNavigation("/?view=about")}
            >
              <Info className="mr-3 h-5 w-5" />
              For Collectors
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-700 hover:text-gray-900"
              onClick={() => handleNavigation("/contact")}
            >
              <Mail className="mr-3 h-5 w-5" />
              Contact
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-700 hover:text-gray-900"
              onClick={() => handleNavigation("/profile")}
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
