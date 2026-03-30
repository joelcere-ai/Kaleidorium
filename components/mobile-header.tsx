"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Menu, User, Search, Heart, Info, Mail, DollarSign } from "lucide-react";

interface MobileHeaderProps {
  currentPage?: "discover" | "collection" | "for-artists" | "for-galleries" | "about" | "contact" | "pricing" | "login" | "profile" | "register";
}

export function MobileHeader({ currentPage }: MobileHeaderProps) {
  const [showMenuModal, setShowMenuModal] = useState(false);
  const router = useRouter();

  const handleLogoClick = () => {
    router.push("/", { scroll: false });
    setShowMenuModal(false);
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="flex justify-between items-center p-4 bg-white border-b border-gray-200">
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
          <img 
            src="/logos/kaleidorium-wordmark-mobile.png" 
            alt="Kaleidorium Logo" 
            className="h-8 w-auto flex-shrink-0"
          />
        </button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/profile")}
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
                className="w-full justify-start text-black hover:bg-gray-100"
                onClick={() => {
                  router.push("/");
                  setShowMenuModal(false);
                }}
              >
                <Search className="mr-3 h-5 w-5" />
                Discover
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-black hover:bg-gray-100"
                onClick={() => {
                  router.push("/collection");
                  setShowMenuModal(false);
                }}
              >
                <Heart className="mr-3 h-5 w-5" />
                My Collection
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-black hover:bg-gray-100"
                onClick={() => {
                  router.push("/?view=why-kaleidorium");
                  setShowMenuModal(false);
                }}
              >
                <Info className="mr-3 h-5 w-5" />
                Why Kaleidorium?
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-black hover:bg-gray-100"
                onClick={() => {
                  router.push("/pricing");
                  setShowMenuModal(false);
                }}
              >
                <DollarSign className="mr-3 h-5 w-5" />
                Pricing
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-black hover:bg-gray-100"
                onClick={() => {
                  router.push("/contact");
                  setShowMenuModal(false);
                }}
              >
                <Mail className="mr-3 h-5 w-5" />
                Contact
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-black hover:bg-gray-100"
                onClick={() => {
                  router.push("/profile");
                  setShowMenuModal(false);
                }}
              >
                <User className="mr-3 h-5 w-5" />
                Profile
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
