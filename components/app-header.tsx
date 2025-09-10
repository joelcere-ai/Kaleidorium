"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { Heart, Menu, Search, User, X, Palette, Info, AtSign, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

interface FilterState {
  style: string
  subject: string
  colors: string
}

function AppHeaderContent({ 
  view, 
  setView, 
  collectionCount,
  onFilterChange,
  onClearFilters,
  isFiltering = false,
  availableTags
}: { 
  view?: "discover" | "collection" | "profile" | "for-artists" | "about" | "contact", 
  setView?: (v: "discover" | "collection" | "profile" | "for-artists" | "about" | "contact") => void, 
  collectionCount?: number,
  onFilterChange?: (filters: FilterState) => void,
  onClearFilters?: () => void,
  isFiltering?: boolean,
  availableTags?: {
    styles: string[],
    subjects: string[],
    colors: string[]
  }
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    style: '',
    subject: '',
    colors: ''
  })
  const [showAutocomplete, setShowAutocomplete] = useState({
    style: false,
    subject: false,
    colors: false
  })
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast()

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

  // Filter functionality - use available tags from artworks or fallback to examples
  const EXAMPLE_TAGS = {
    style: availableTags?.styles?.length ? availableTags.styles : ['Abstract', 'Portrait', 'Landscape', 'Digital Art', 'Neo-Expressionism', 'Contemporary', 'Minimalist'],
    subject: availableTags?.subjects?.length ? availableTags.subjects : ['Nature', 'Urban', 'Portrait', 'Abstract figure', 'Still life', 'Architecture', 'Animals'],
    colors: availableTags?.colors?.length ? availableTags.colors : ['Black', 'White', 'Colorful', 'Monochrome', 'Blue', 'Red', 'Green', 'Warm tones', 'Cool tones']
  }

  const handleFilterRefresh = () => {
    if (onFilterChange) {
      onFilterChange(filters)
    }
    
    // Close the filter panel after applying
    setShowFilters(false)
    
    toast({
      title: "Filters Applied",
      description: "Updating recommendations based on your preferences",
    })
  }

  const addFilterTag = (category: keyof FilterState, tag: string) => {
    setFilters(prev => ({
      ...prev,
      [category]: prev[category] ? `${prev[category]}, ${tag}` : tag
    }))
  }

  const toggleFilters = () => {
    setShowFilters(!showFilters)
    setIsMobileMenuOpen(false) // Close mobile menu when opening filters
  }

  // Get filtered suggestions based on current input
  const getFilteredSuggestions = (category: keyof FilterState, input: string) => {
    if (!input.trim()) return EXAMPLE_TAGS[category].slice(0, 10) // Show first 10 by default
    
    const searchTerm = input.toLowerCase()
    return EXAMPLE_TAGS[category]
      .filter((tag: string) => tag.toLowerCase().includes(searchTerm))
      .slice(0, 10) // Limit to 10 suggestions
  }

  const handleInputChange = (category: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [category]: value }))
    setShowAutocomplete(prev => ({ ...prev, [category]: value.length > 0 }))
  }

  const selectSuggestion = (category: keyof FilterState, suggestion: string) => {
    const currentValue = filters[category]
    const newValue = currentValue ? `${currentValue}, ${suggestion}` : suggestion
    setFilters(prev => ({ ...prev, [category]: newValue }))
    setShowAutocomplete(prev => ({ ...prev, [category]: false }))
  }

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
      <div className="flex items-center justify-between p-4 md:p-6">
        {/* Logo with improved mobile spacing */}
        <Link href="/" className="flex items-center space-x-2 py-2 px-1 md:py-0 md:px-0">
          <span className="font-serif text-xl md:text-2xl font-semibold tracking-wide">Kaleidorium</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <Button 
            variant="ghost" 
            className={`text-sm ${isSelected("discover") ? "bg-gray-100" : ""}`}
            onClick={() => handleNav("discover")}
          >
            <Palette className="w-4 h-4 mr-1" />
            Discover
          </Button>
          
          <Button 
            variant="ghost" 
            className={`text-sm relative ${isSelected("collection") ? "bg-gray-100" : ""}`}
            onClick={() => handleNav("collection")}
          >
            <Heart className="w-4 h-4 mr-1" />
            Collection
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

          {/* Filter Button - Only show on discover page */}
          {(view === "discover" || (!view && isSelected("discover"))) && (
            <Button 
              variant="ghost" 
              className={`text-sm ${showFilters ? "bg-gray-100" : ""} ${isFiltering ? "text-blue-600" : ""}`}
              onClick={toggleFilters}
            >
              <Search className="w-4 h-4 mr-1" />
              Filters
              {isFiltering && <span className="ml-1 w-2 h-2 bg-blue-600 rounded-full"></span>}
            </Button>
          )}

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
              Discover
            </Button>

            {/* Mobile Filter Button - Only show on discover page */}
            {(view === "discover" || (!view && isSelected("discover"))) && (
              <Button 
                variant="ghost" 
                className={`justify-start ${showFilters ? "bg-gray-100" : ""} ${isFiltering ? "text-blue-600" : ""}`}
                onClick={toggleFilters}
              >
                <Search className="w-4 h-4 mr-2" />
                Filters
                {isFiltering && <span className="ml-2 w-2 h-2 bg-blue-600 rounded-full"></span>}
              </Button>
            )}
            
            <Button
              variant="ghost"
              className={`justify-start relative ${isSelected("collection") ? "bg-gray-100" : ""}`}
              onClick={() => handleNav("collection")}
            >
              <Heart className="w-4 h-4 mr-2" />
              Collection
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

      {/* Filter Panel */}
      {showFilters && (view === "discover" || (!view && isSelected("discover"))) && (
        <div className="border-t bg-gray-50 absolute w-full z-40 shadow-lg">
          <div className="p-6 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Style Filter */}
              <div className="relative">
                <label className="block text-sm font-medium mb-2">Style</label>
                <Input
                  placeholder="e.g. Abstract, Portrait, Digital Art..."
                  value={filters.style}
                  onChange={(e) => handleInputChange('style', e.target.value)}
                  onFocus={() => setShowAutocomplete(prev => ({ ...prev, style: true }))}
                  onBlur={() => setTimeout(() => setShowAutocomplete(prev => ({ ...prev, style: false })), 200)}
                  className="mb-2"
                />
                
                {/* Autocomplete dropdown */}
                {showAutocomplete.style && (
                  <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto">
                    {getFilteredSuggestions('style', filters.style).map((suggestion: string) => (
                      <div
                        key={suggestion}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                        onMouseDown={() => selectSuggestion('style', suggestion)}
                      >
                        {suggestion}
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="flex flex-wrap gap-1">
                  {EXAMPLE_TAGS.style.slice(0, 7).map((tag: string) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="cursor-pointer hover:bg-gray-200 text-xs"
                      onClick={() => addFilterTag('style', tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Subject Filter */}
              <div className="relative">
                <label className="block text-sm font-medium mb-2">Subject</label>
                <Input
                  placeholder="e.g. Nature, Urban, Portrait..."
                  value={filters.subject}
                  onChange={(e) => handleInputChange('subject', e.target.value)}
                  onFocus={() => setShowAutocomplete(prev => ({ ...prev, subject: true }))}
                  onBlur={() => setTimeout(() => setShowAutocomplete(prev => ({ ...prev, subject: false })), 200)}
                  className="mb-2"
                />
                
                {/* Autocomplete dropdown */}
                {showAutocomplete.subject && (
                  <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto">
                    {getFilteredSuggestions('subject', filters.subject).map((suggestion: string) => (
                      <div
                        key={suggestion}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                        onMouseDown={() => selectSuggestion('subject', suggestion)}
                      >
                        {suggestion}
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="flex flex-wrap gap-1">
                  {EXAMPLE_TAGS.subject.slice(0, 7).map((tag: string) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="cursor-pointer hover:bg-gray-200 text-xs"
                      onClick={() => addFilterTag('subject', tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Colors Filter */}
              <div className="relative">
                <label className="block text-sm font-medium mb-2">Colors</label>
                <Input
                  placeholder="e.g. Black, Colorful, Warm tones..."
                  value={filters.colors}
                  onChange={(e) => handleInputChange('colors', e.target.value)}
                  onFocus={() => setShowAutocomplete(prev => ({ ...prev, colors: true }))}
                  onBlur={() => setTimeout(() => setShowAutocomplete(prev => ({ ...prev, colors: false })), 200)}
                  className="mb-2"
                />
                
                {/* Autocomplete dropdown */}
                {showAutocomplete.colors && (
                  <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto">
                    {getFilteredSuggestions('colors', filters.colors).map((suggestion: string) => (
                      <div
                        key={suggestion}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                        onMouseDown={() => selectSuggestion('colors', suggestion)}
                      >
                        {suggestion}
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="flex flex-wrap gap-1">
                  {EXAMPLE_TAGS.colors.slice(0, 7).map((tag: string) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="cursor-pointer hover:bg-gray-200 text-xs"
                      onClick={() => addFilterTag('colors', tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Filter Action Buttons */}
            <div className="flex justify-center gap-4 mt-6">
              <Button 
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleFilterRefresh()
                }} 
                className="px-6"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Apply Filters
              </Button>
              {isFiltering && onClearFilters && (
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onClearFilters()
                  }} 
                  className="px-6"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export function AppHeader(props: { 
  view?: "discover" | "collection" | "profile" | "for-artists" | "about" | "contact", 
  setView?: (v: "discover" | "collection" | "profile" | "for-artists" | "about" | "contact") => void, 
  collectionCount?: number,
  onFilterChange?: (filters: FilterState) => void,
  onClearFilters?: () => void,
  isFiltering?: boolean,
  availableTags?: {
    styles: string[],
    subjects: string[],
    colors: string[]
  }
}) {
  return (
    <Suspense fallback={<div className="border-b bg-background h-16 flex items-center px-4">Loading...</div>}>
      <AppHeaderContent {...props} />
    </Suspense>
  );
}

export type { FilterState }

