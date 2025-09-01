"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { Heart, Menu, Search, User, X, Palette, Info, AtSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"

function AppHeaderContent({ view, setView, collectionCount }: { view?: "discover" | "collection" | "profile" | "for-artists" | "about" | "contact", setView?: (v: "discover" | "collection" | "profile" | "for-artists" | "about" | "contact") => void, collectionCount?: number }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleNav = (target: "discover" | "collection" | "for-artists" | "about") => {
    if (pathname === "/" && setView) {
      setView(target);
    } else {
      router.push(`/?view=${target}`);
    }
    setIsMobileMenuOpen(false);
  };

  // Helper to determine if a menu item is selected
  const isSelected = (target: string) => {
    if (target === "contact") return pathname === "/contact";
    if (target === "profile") return pathname === "/profile";
    if (["discover", "collection", "for-artists", "about"].includes(target)) {
      const paramView = searchParams.get("view");
      if (!paramView && pathname === "/") return target === "discover"; // default to discover
      return paramView === target;
    }
    return false;
  };

  return (
    <header className="border-b bg-background relative app-header">
      <div className="flex items-center justify-between p-4">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <span className="font-serif text-xl font-semibold">Kaleidorium</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <Button 
            variant="ghost" 
            className={`text-sm ${isSelected("discover") ? "bg-gray-100" : ""}`}
            onClick={() => handleNav("discover")}
          >
            <Palette className="w-4 h-4 mr-1" />
            Discover Art
          </Button>
          
          <Button 
            variant="ghost" 
            className={`text-sm relative ${isSelected("collection") ? "bg-gray-100" : ""}`}
            onClick={() => handleNav("collection")}
          >
            <Heart className="w-4 h-4 mr-1" />
            Collection
            {collectionCount && collectionCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {collectionCount}
              </span>
            )}
          </Button>
          
          <Button 
            variant="ghost" 
            className={`text-sm ${isSelected("for-artists") ? "bg-gray-100" : ""}`}
            onClick={() => handleNav("for-artists")}
          >
            <Palette className="w-4 h-4 mr-1" />
            For Artists
          </Button>
          
          <Button 
            variant="ghost" 
            className={`text-sm ${isSelected("about") ? "bg-gray-100" : ""}`}
            onClick={() => handleNav("about")}
          >
            <Info className="w-4 h-4 mr-1" />
            About
          </Button>

          <Link href="/contact">
            <Button 
              variant="ghost" 
              className={`text-sm ${isSelected("contact") ? "bg-gray-100" : ""}`}
            >
              <AtSign className="w-4 h-4 mr-1" />
              Contact
            </Button>
          </Link>

          {user ? (
            <Link href="/profile">
              <Button 
                variant="ghost" 
                className={`text-sm ${isSelected("profile") ? "bg-gray-100" : ""}`}
              >
                <User className="w-4 h-4 mr-1" />
                Profile
              </Button>
            </Link>
          ) : (
            <Link href="/login">
              <Button variant="ghost" className="text-sm">
                <User className="w-4 h-4 mr-1" />
                Sign In
              </Button>
            </Link>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="sm"
          className="md:hidden"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t bg-background absolute w-full z-50 shadow-lg">
          <div className="flex flex-col space-y-2 p-4">
            <Button
              variant="ghost"
              className={`justify-start ${isSelected("discover") ? "bg-gray-100" : ""}`}
              onClick={() => handleNav("discover")}
            >
              <Palette className="w-4 h-4 mr-2" />
              Discover Art
            </Button>
            
            <Button
              variant="ghost"
              className={`justify-start relative ${isSelected("collection") ? "bg-gray-100" : ""}`}
              onClick={() => handleNav("collection")}
            >
              <Heart className="w-4 h-4 mr-2" />
              Collection
              {collectionCount && collectionCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {collectionCount}
                </span>
              )}
            </Button>
            
            <Button
              variant="ghost"
              className={`justify-start ${isSelected("for-artists") ? "bg-gray-100" : ""}`}
              onClick={() => handleNav("for-artists")}
            >
              <Palette className="w-4 h-4 mr-2" />
              For Artists
            </Button>
            
            <Button
              variant="ghost"
              className={`justify-start ${isSelected("about") ? "bg-gray-100" : ""}`}
              onClick={() => handleNav("about")}
            >
              <Info className="w-4 h-4 mr-2" />
              About
            </Button>

            <Link href="/contact">
              <Button
                variant="ghost"
                className={`w-full justify-start ${isSelected("contact") ? "bg-gray-100" : ""}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <AtSign className="w-4 h-4 mr-2" />
                Contact
              </Button>
            </Link>

            {user ? (
              <Link href="/profile">
                <Button
                  variant="ghost"
                  className={`w-full justify-start ${isSelected("profile") ? "bg-gray-100" : ""}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <User className="w-4 h-4 mr-2" />
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export function AppHeader(props: { view?: "discover" | "collection" | "profile" | "for-artists" | "about" | "contact", setView?: (v: "discover" | "collection" | "profile" | "for-artists" | "about" | "contact") => void, collectionCount?: number }) {
  return (
    <Suspense fallback={<div className="border-b bg-background h-16 flex items-center px-4">Loading...</div>}>
      <AppHeaderContent {...props} />
    </Suspense>
  );
}

