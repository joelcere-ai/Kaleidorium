"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Menu, User, Search, Heart, Palette, Info, Mail, LogIn } from "lucide-react";

interface MobileHeaderProps {
  currentPage?: "discover" | "collection" | "for-artists" | "about" | "contact" | "login" | "profile" | "register";
}

export function MobileHeader({ currentPage }: MobileHeaderProps) {
  const [showMenuModal, setShowMenuModal] = useState(false);
  const router = useRouter();

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
        <h1 className="text-xl font-bold text-black">Kaleidorium</h1>
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
                  router.push("/?view=discover");
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
                  router.push("/?view=for-artists");
                  setShowMenuModal(false);
                }}
              >
                <Palette className="mr-3 h-5 w-5" />
                For Artists
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-black hover:bg-gray-100"
                onClick={() => {
                  router.push("/?view=about");
                  setShowMenuModal(false);
                }}
              >
                <Info className="mr-3 h-5 w-5" />
                For Collectors
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
