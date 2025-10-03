"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Search, Heart, User, Palette, Info, Mail } from "lucide-react";
import { useNavigation } from "@/components/navigation-context";

// Desktop header props interface - supports terms and privacy pages
interface DesktopHeaderProps {
  currentPage?: "discover" | "collection" | "profile" | "for-artists" | "about" | "contact" | "login" | "register" | "terms" | "privacy";
  collectionCount?: number;
}

export function DesktopHeader({ currentPage, collectionCount = 0 }: DesktopHeaderProps) {
  const [showMenu, setShowMenu] = useState(false);
  const router = useRouter();
  const { navigateToView } = useNavigation();

  const isSelected = (view: string) => currentPage === view;

  const handleNavigation = (view: "discover" | "collection" | "profile" | "for-artists" | "about" | "contact") => {
    navigateToView(view);
    setShowMenu(false);
  };

  return (
    <header className="border-b bg-background relative app-header z-10">
      <div className="flex items-center justify-between p-4 md:p-6">
        {/* Logo with improved mobile spacing */}
        <Button 
          variant="ghost" 
          className="flex items-center space-x-2 py-2 px-1 md:py-0 md:px-0"
          onClick={() => handleNavigation("discover")}
        >
          <span className="font-serif text-xl font-semibold text-black">Kaleidorium</span>
        </Button>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <Button 
            variant="ghost" 
            className={`text-sm ${isSelected("discover") ? "bg-gray-100" : ""}`}
            onClick={() => handleNavigation("discover")}
          >
            <Palette className="w-4 h-4 mr-1" />
            Discover
          </Button>
          
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
            className={`text-sm ${isSelected("about") ? "bg-gray-100" : ""}`}
            onClick={() => handleNavigation("about")}
          >
            <Info className="w-4 h-4 mr-1" />
            For Collectors
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
            Profile
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
              onClick={() => handleNavigation("about")}
            >
              <Info className="mr-3 h-5 w-5" />
              For Collectors
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
