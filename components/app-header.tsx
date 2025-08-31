"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Heart, Menu, Search, User, X, Palette, Info, AtSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"

export function AppHeader({ view, setView, collectionCount }: { view?: "discover" | "collection" | "profile" | "for-artists" | "about" | "contact", setView?: (v: "discover" | "collection" | "profile" | "for-artists" | "about" | "contact") => void, collectionCount?: number }) {
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
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center">
            <div className="w-[144px] h-8 relative">
              <Image
                src="/kaleidorium-logo.jpg"
                alt="Kaleidorium Logo"
                width={144}
                height={32}
                priority
                className="w-full h-full object-contain"
              />
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Button variant={isSelected("discover") ? "default" : "ghost"} className={isSelected("discover") ? "h-9 bg-black text-white" : "h-9"} onClick={() => handleNav("discover")}> <Search className="mr-2 h-4 w-4" /> Discover</Button>
            <Button variant={isSelected("collection") ? "default" : "ghost"} className={isSelected("collection") ? "h-9 bg-black text-white" : "h-9"} onClick={() => handleNav("collection")}> <Heart className="mr-2 h-4 w-4" /> My Collection</Button>
            <Button variant={isSelected("for-artists") ? "default" : "ghost"} className={isSelected("for-artists") ? "h-9 bg-black text-white" : "h-9"} onClick={() => handleNav("for-artists")}> <Palette className="mr-2 h-4 w-4" /> For Artists</Button>
            <Button variant={isSelected("about") ? "default" : "ghost"} className={isSelected("about") ? "h-9 bg-black text-white" : "h-9"} onClick={() => handleNav("about")}> <Info className="mr-2 h-4 w-4" /> About</Button>
            <Link href="/contact"><Button variant={isSelected("contact") ? "default" : "ghost"} className={isSelected("contact") ? "h-9 bg-black text-white" : "h-9"}><AtSign className="mr-2 h-4 w-4" />Contact</Button></Link>
            <Link href="/profile"><Button variant={isSelected("profile") ? "default" : "ghost"} className={isSelected("profile") ? "h-9 bg-black text-white" : "h-9"}><User className="mr-2 h-4 w-4" />Profile</Button></Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {/* Show Register and Sign In if not authenticated */}
          {!user && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => router.push('/register')}
              >
                Register
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/profile?tab=account')}
              >
                Sign In
              </Button>
            </div>
          )}
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-background border-b z-50 md:hidden">
          <nav className="container py-4 flex flex-col gap-2">
            <Button variant={isSelected("discover") ? "default" : "ghost"} className={isSelected("discover") ? "justify-start w-full bg-black text-white" : "justify-start w-full"} onClick={() => handleNav("discover")}> <Search className="mr-2 h-4 w-4" /> Discover</Button>
            <Button variant={isSelected("collection") ? "default" : "ghost"} className={isSelected("collection") ? "justify-start w-full bg-black text-white" : "justify-start w-full"} onClick={() => handleNav("collection")}> <Heart className="mr-2 h-4 w-4" /> My Collection</Button>
            <Button variant={isSelected("for-artists") ? "default" : "ghost"} className={isSelected("for-artists") ? "justify-start w-full bg-black text-white" : "justify-start w-full"} onClick={() => handleNav("for-artists")}> <Palette className="mr-2 h-4 w-4" /> For Artists</Button>
            <Button variant={isSelected("about") ? "default" : "ghost"} className={isSelected("about") ? "justify-start w-full bg-black text-white" : "justify-start w-full"} onClick={() => handleNav("about")}> <Info className="mr-2 h-4 w-4" /> About</Button>
            <Link href="/contact"><Button variant={isSelected("contact") ? "default" : "ghost"} className={isSelected("contact") ? "justify-start w-full bg-black text-white" : "justify-start w-full"}><AtSign className="mr-2 h-4 w-4" />Contact</Button></Link>
            <Link href="/profile"><Button variant={isSelected("profile") ? "default" : "ghost"} className={isSelected("profile") ? "justify-start w-full bg-black text-white" : "justify-start w-full"}><User className="mr-2 h-4 w-4" />Profile</Button></Link>
          </nav>
        </div>
      )}
    </header>
  )
}

