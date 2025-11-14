"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { Heart, ThumbsUp, ThumbsDown, Info, Menu, Search, Palette, Mail, User, Facebook, Instagram, MessageCircle, Trash, RefreshCw, ChevronDown, ChevronUp, X } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import type { Artwork } from "@/types/artwork"
import { CollectorArchetype, analyzeCollectionForArchetype } from "@/lib/collector-archetypes"
import { CollectorArchetypeCard } from "@/components/collector-archetype-card"
import { ArtistNameWithBadge } from "@/components/artist-name-with-badge"

// Helper function to format dimensions with units
const formatDimensions = (dimensions: string): string => {
  if (!dimensions) return '';
  
  // If dimensions already include units (contains letters), return as is
  if (/[a-zA-Z]/.test(dimensions)) {
    return dimensions;
  }
  
  // If dimensions are just numbers and 'x' (like "1920x1080"), add default unit
  if (/^\d+x\d+$/.test(dimensions)) {
    return `${dimensions} px`;
  }
  
  // Return as is for any other format
  return dimensions;
};

// Custom X (formerly Twitter) icon component
const XIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
)

interface MobileCardStackProps {
  artworks: Artwork[]
  onLike: (artwork: Artwork) => void
  onDislike: (artwork: Artwork) => void
  onAddToCollection: (artwork: Artwork) => void
  onLoadMore: () => void
  setView: (view: "discover" | "collection" | "profile" | "for-artists" | "about" | "contact" | "terms" | "privacy") => void
  view: "discover" | "collection"
  collection: Artwork[]
  onRemoveFromCollection: (id: string) => void
  onFilterChange?: (filters: { style: string[], subject: string[], colors: string[] }) => void
  onClearFilters?: () => void
  showFallbackMessage?: boolean
  isLandscape?: boolean
  isPortrait?: boolean
  screenWidth?: number
  screenHeight?: number
}

export default function MobileCardStack({
  artworks,
  onLike,
  onDislike,
  onAddToCollection,
  onLoadMore,
  setView,
  view = "discover",
  collection = [],
  onRemoveFromCollection,
  onFilterChange,
  onClearFilters,
  showFallbackMessage = false,
  isLandscape = false,
  isPortrait = true,
  screenWidth = 0,
  screenHeight = 0,
}: MobileCardStackProps) {
  const router = useRouter();
  const { toast } = useToast()
  const [visibleCardCount, setVisibleCardCount] = useState(3)
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [showMenuModal, setShowMenuModal] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null)
  const [showFullscreenArtwork, setShowFullscreenArtwork] = useState(false)
  const [fullscreenImageLoaded, setFullscreenImageLoaded] = useState(false)
  const [currentCollectionIndex, setCurrentCollectionIndex] = useState(0)
  
  // Art Preferences state (copied from desktop)
  const [insights, setInsights] = useState({
    summary: "Click 'Refresh Insights' to analyze your collection.",
    aesthetic_profile: "",
    collecting_pattern: "",
    topArtists: [],
    topTags: [],
    priceRange: "N/A",
    recommendations: [],
    preferredMediums: []
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCollectionDetailsExpanded, setIsCollectionDetailsExpanded] = useState(false);
  const [userArchetype, setUserArchetype] = useState<CollectorArchetype | null>(null);
  
  // Filter states - now arrays for multiple tags
  const [filters, setFilters] = useState({
    style: [] as string[],
    subject: [] as string[],
    colors: [] as string[]
  })
  const [showAutocomplete, setShowAutocomplete] = useState({
    style: false,
    subject: false,
    colors: false
  })
  const [inputValues, setInputValues] = useState({
    style: '',
    subject: '',
    colors: ''
  })
  
  // Swipe states
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null)
  const [swipeDistance, setSwipeDistance] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  
  // Button animation states
  const [buttonStates, setButtonStates] = useState<{
    dislike: boolean
    info: boolean
    add: boolean
    like: boolean
  }>({
    dislike: false,
    info: false,
    add: false,
    like: false
  })

  const containerRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  const startX = useRef(0)
  const currentX = useRef(0)
  const isDragging = useRef(false)

  // Handle scroll-based loading with throttling
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null
    
    const handleScroll = () => {
      if (!containerRef.current) return

      // Throttle scroll events
      if (timeoutId) return
      
      timeoutId = setTimeout(() => {
        const { scrollTop, scrollHeight, clientHeight } = containerRef.current!
        const scrollPercentage = (scrollTop + clientHeight) / scrollHeight

        // Load more when user scrolls to 80% of the content
        if (scrollPercentage > 0.8 && visibleCardCount < artworks.length) {
          setVisibleCardCount(prev => Math.min(prev + 3, artworks.length))
          
          // If we're near the end of local artworks, trigger load more
          if (visibleCardCount >= artworks.length - 3) {
            onLoadMore()
          }
        }
        timeoutId = null
      }, 100) // Throttle to 100ms
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true })
      return () => {
        container.removeEventListener('scroll', handleScroll)
        if (timeoutId) clearTimeout(timeoutId)
      }
    }
  }, [visibleCardCount, artworks.length, onLoadMore])

  // Reset visible cards when artworks change (e.g., after filtering)
  useEffect(() => {
    setVisibleCardCount(3)
  }, [artworks])

  // Prevent pull-to-refresh when modal is open
  useEffect(() => {
    if (showInfoModal) {
      document.body.style.overscrollBehavior = 'none'
      document.body.style.touchAction = 'pan-x pan-y'
      document.documentElement.style.overscrollBehavior = 'none'
    } else {
      document.body.style.overscrollBehavior = ''
      document.body.style.touchAction = ''
      document.documentElement.style.overscrollBehavior = ''
    }
    
    return () => {
      document.body.style.overscrollBehavior = ''
      document.body.style.touchAction = ''
      document.documentElement.style.overscrollBehavior = ''
    }
  }, [showInfoModal])

  // Handle keyboard shortcuts for fullscreen
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showFullscreenArtwork) {
        handleFullscreenClose()
      }
    }

    if (showFullscreenArtwork) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [showFullscreenArtwork])

  // Filter functionality
  const EXAMPLE_TAGS = {
    style: ['Digital Art', 'Abstract', 'Portrait', 'Contemporary', 'Modern', 'Realism', 'Impressionism', 'Cubism', 'Surrealism', 'Minimalism', 'Digital'],
    subject: ['portrait', 'Nature', 'Urban', 'Abstract', 'Landscape', 'Still Life', 'Architecture', 'Animals', 'People', 'City', 'consciousness'],
    colors: ['grey', 'pink', 'Black', 'Colorful', 'Warm', 'Cool', 'Monochrome', 'Blue', 'Red', 'Green', 'Yellow', 'Purple']
  }

  const getFilteredSuggestions = (type: keyof typeof filters, query: string) => {
    if (!query.trim()) return []
    const tags = EXAMPLE_TAGS[type]
    const currentTags = filters[type]
    return tags.filter(tag => 
      tag.toLowerCase().includes(query.toLowerCase()) && 
      !currentTags.includes(tag)
    ).slice(0, 5)
  }

  const handleInputChange = (type: keyof typeof filters, value: string) => {
    setInputValues(prev => ({ ...prev, [type]: value }))
  }

  const selectSuggestion = (type: keyof typeof filters, suggestion: string) => {
    if (!filters[type].includes(suggestion)) {
      setFilters(prev => ({ ...prev, [type]: [...prev[type], suggestion] }))
    }
    setInputValues(prev => ({ ...prev, [type]: '' }))
    setShowAutocomplete(prev => ({ ...prev, [type]: false }))
  }

  const addFilterTag = (type: keyof typeof filters, tag: string) => {
    if (!filters[type].includes(tag)) {
      setFilters(prev => ({ ...prev, [type]: [...prev[type], tag] }))
    }
  }

  const removeFilterTag = (type: keyof typeof filters, tagToRemove: string) => {
    setFilters(prev => ({ 
      ...prev, 
      [type]: prev[type].filter(tag => tag !== tagToRemove) 
    }))
  }

  const clearFilters = () => {
    setFilters({ style: [], subject: [], colors: [] })
    setInputValues({ style: '', subject: '', colors: '' })
    
    // Call parent's clear handler if provided
    if (onClearFilters) {
      onClearFilters()
    }
  }

  const applyFilters = () => {
    // Convert array filters to comma-separated strings for compatibility with desktop filter system
    const filterState = {
      style: filters.style.join(', '),
      subject: filters.subject.join(', '),
      colors: filters.colors.join(', ')
    }
    
    // Call parent's filter handler if provided
    if (onFilterChange) {
      onFilterChange(filters)
    }
    
    // Close the filter panel
    setShowFilters(false)
  }

  const visibleArtworks = artworks.slice(0, visibleCardCount)

  // Get dynamic classes based on orientation
  const getContainerClasses = () => {
    if (isLandscape) {
      return "fixed inset-0 bg-white z-50 flex flex-col overflow-hidden"
    }
    return "fixed inset-0 bg-white z-50 flex flex-col"
  }

  const getMainAreaClasses = () => {
    if (isLandscape) {
      return "flex-1 relative overflow-hidden bg-gray-50"
    }
    return "flex-1 relative overflow-hidden bg-gray-50"
  }

  // Swipe handlers
  const handleTouchStart = (e: React.TouchEvent, artworkId: string) => {
    if (showInfoModal || isAnimating) return
    
    const touch = e.touches[0]
    startX.current = touch.clientX
    isDragging.current = true
  }

  const handleTouchMove = (e: React.TouchEvent, artworkId: string) => {
    if (!isDragging.current || showInfoModal || isAnimating) return
    
    const touch = e.touches[0]
    currentX.current = touch.clientX - startX.current
    
    // Only handle horizontal swipes
    if (Math.abs(currentX.current) > 10) {
      // Only prevent default for significant horizontal movement
      if (Math.abs(currentX.current) > 20) {
        e.preventDefault()
      }
      setSwipeDistance(currentX.current)
      
      if (currentX.current > 50) {
        setSwipeDirection('right')
      } else if (currentX.current < -50) {
        setSwipeDirection('left')
      } else {
        setSwipeDirection(null)
      }
      
      // Apply transform to card
      const cardRef = cardRefs.current[artworkId]
      if (cardRef) {
        const rotation = currentX.current * 0.1
        const opacity = 1 - Math.abs(currentX.current) / 300
        cardRef.style.transform = `translateX(${currentX.current}px) rotate(${rotation}deg)`
        cardRef.style.opacity = opacity.toString()
      }
    }
  }

  const handleTouchEnd = (artworkId: string, artwork: Artwork) => {
    if (!isDragging.current || showInfoModal || isAnimating) return
    
    isDragging.current = false
    const distance = Math.abs(currentX.current)
    
    if (distance > 100) {
      // Horizontal swipe - execute action immediately for better UX
      setIsAnimating(true)
      
      // Execute action immediately without waiting for animation
      if (currentX.current > 0) {
        // Swipe right - Like
        onLike(artwork)
        toast({
          title: "Liked!",
          description: `"${artwork.title}" by ${artwork.artist}`,
        })
      } else {
        // Swipe left - Dislike
        onDislike(artwork)
        toast({
          title: "Disliked!",
          description: `"${artwork.title}" by ${artwork.artist}`,
        })
      }
      
      // Animate card out and advance to next card (mobile behavior)
      const cardRef = cardRefs.current[artworkId]
      if (cardRef) {
        const finalX = currentX.current > 0 ? (screenWidth || window.innerWidth) : -(screenWidth || window.innerWidth)
        cardRef.style.transition = 'transform 0.2s ease-out, opacity 0.2s ease-out'
        cardRef.style.transform = `translateX(${finalX}px) rotate(${currentX.current * 0.2}deg)`
        cardRef.style.opacity = '0'
      }
      
      // Reset and advance to next card
      setTimeout(() => {
        resetCard(artworkId)
        setIsAnimating(false)
        // Advance to next card by incrementing visible card count
        setVisibleCardCount(prev => Math.min(prev + 1, artworks.length))
      }, 200)
    } else {
      // Snap back quickly
      resetCard(artworkId)
    }
    
    setSwipeDirection(null)
    setSwipeDistance(0)
    currentX.current = 0
  }

  const resetCard = (artworkId: string) => {
    const cardRef = cardRefs.current[artworkId]
    if (cardRef) {
      cardRef.style.transition = 'none'
      cardRef.style.transform = 'translateX(0px) rotate(0deg)'
      cardRef.style.opacity = '1'
      // Restore transition after reset
      setTimeout(() => {
        if (cardRef) {
          cardRef.style.transition = ''
        }
      }, 50)
    }
  }

  // Art Preferences functions (copied from desktop)
  const generateInsights = async () => {
    setIsGenerating(true)
    try {
      // First get basic analysis for stats
      const basicAnalysis = analyzeCollection()
      
      // Then get AI-powered insights if collection has artworks
      if (collection.length > 0) {
        const response = await fetch('/api/profile-insights', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            collection: collection
          })
        })
        
        if (response.ok) {
          const aiInsights = await response.json()
          setInsights({
            ...basicAnalysis,
            summary: aiInsights.summary,
            aesthetic_profile: aiInsights.aesthetic_profile,
            collecting_pattern: aiInsights.collecting_pattern,
            recommendations: aiInsights.recommendations
          })
        } else {
          // Fallback to basic analysis if AI fails
          setInsights(basicAnalysis)
        }
        
        // Analyze collector archetype
        const archetype = analyzeCollectionForArchetype(collection)
        setUserArchetype(archetype)
      } else {
        setInsights(basicAnalysis)
        // Analyze collector archetype even with empty collection
        const archetype = analyzeCollectionForArchetype(collection)
        setUserArchetype(archetype)
      }
    } catch (error) {
      console.error('Error generating insights:', error)
      setInsights(analyzeCollection())
    } finally {
      setIsGenerating(false)
    }
  }

  const analyzeCollection = (): any => {
    if (collection.length === 0) {
      return {
        summary: "Your collection is empty. Add some artworks to get insights.",
        topArtists: [],
        topTags: [],
        priceRange: "N/A",
        recommendations: [],
        preferredMediums: []
      };
    }

    const artistCounts: Record<string, number> = {};
    const tagCounts: Record<string, number> = {};
    const mediumCounts: Record<string, number> = {};
    const prices: number[] = [];

    collection.forEach((artwork) => {
      if (artwork.artist) {
        artistCounts[artwork.artist] = (artistCounts[artwork.artist] || 0) + 1;
      }
      if (artwork.tags && Array.isArray(artwork.tags)) {
        artwork.tags.forEach((tag: string) => {
          if (tag) tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
      if (artwork.medium) {
        mediumCounts[artwork.medium] = (mediumCounts[artwork.medium] || 0) + 1;
      }
      if (artwork.price) {
        const price = parseFloat(artwork.price.replace(/[^0-9.-]+/g, ""));
        if(!isNaN(price)) prices.push(price);
      }
    });

    const getTopItems = (counts: Record<string, number>, count: number) =>
      Object.entries(counts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, count)
        .map(([name]) => name);

    const topArtists = getTopItems(artistCounts, 3);
    const topTags = getTopItems(tagCounts, 5);
    const preferredMediums = getTopItems(mediumCounts, 3);
    
    const priceRange = prices.length > 0 
      ? `$${Math.min(...prices).toLocaleString()} - $${Math.max(...prices).toLocaleString()}` 
      : "N/A";

    let summary = `Your diverse collection spans multiple styles including ${topTags.slice(0, 3).join(", ")}, showing an eclectic taste in digital art.`;
    if (collection.length === 1) {
      summary = `Your collection features a single piece by ${topArtists[0]}. This ${topTags[0] || 'abstract'} artwork suggests you're just beginning to explore the world of digital art.`;
    }

    const recommendations = [];
    if (topTags.includes("Abstract")) {
      recommendations.push("Explore more works in the generative and abstract genres.");
    }
    if (recommendations.length === 0) {
      recommendations.push("Explore more works in the Discover section to refine your preferences");
    }

    return {
      summary,
      topArtists,
      topTags,
      priceRange,
      preferredMediums,
      recommendations,
    };
  };

  // Enhanced button action handler with micro-interactions
  const handleButtonAction = async (action: 'like' | 'dislike' | 'add' | 'info', artwork: Artwork) => {
    // Trigger haptic feedback if available
    if (navigator.vibrate) {
      navigator.vibrate(50)
    }

    // Button animation
    setButtonStates(prev => ({ ...prev, [action]: true }))
    setTimeout(() => {
      setButtonStates(prev => ({ ...prev, [action]: false }))
    }, 200)

    switch (action) {
      case 'like':
        onLike(artwork)
        toast({
          title: "Liked!",
          description: `"${artwork.title}" by ${artwork.artist}`,
        })
        break
      case 'dislike':
        onDislike(artwork)
        toast({
          title: "Disliked!",
          description: `"${artwork.title}" by ${artwork.artist}`,
        })
        break
      case 'add':
        onAddToCollection(artwork)
        toast({
          title: "Added to Collection!",
          description: `"${artwork.title}" by ${artwork.artist}`,
        })
        break
      case 'info':
        setSelectedArtwork(artwork)
        setShowInfoModal(true)
        break
    }
  }

  // Handle artwork tap for full-screen view
  const handleArtworkTap = (artwork: Artwork) => {
    setSelectedArtwork(artwork)
    setFullscreenImageLoaded(false)
    setShowFullscreenArtwork(true)
    // Haptic feedback for fullscreen
    if (navigator.vibrate) {
      navigator.vibrate(30)
    }
  }

  // Handle fullscreen close
  const handleFullscreenClose = () => {
    setShowFullscreenArtwork(false)
    setFullscreenImageLoaded(false)
  }

  // Collection View
  if (view === "collection") {
    return (
      <div className={getContainerClasses()}>
        {/* Header */}
        <div className="flex justify-between items-center p-4 bg-white border-b border-gray-200">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowMenuModal(true)}
            className="text-black hover:bg-gray-100"
          >
            <Menu className="w-6 h-6" />
          </Button>
          <h1 className="font-serif text-xl font-semibold text-black">Kaleidorium</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setView("profile")}
            className="text-black hover:bg-gray-100"
          >
            <User className="w-6 h-6" />
          </Button>
        </div>

        {/* Collection Content */}
        <div className="flex-1 overflow-y-auto p-4" ref={containerRef}>
          {/* Two-Tier Artistic Profile Section */}
          <div className="mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Your Artistic Profile</CardTitle>
                </div>
                <Button className="bg-black text-white hover:bg-gray-800" size="sm" onClick={generateInsights} disabled={isGenerating}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${isGenerating ? "animate-spin" : ""}`} />
                  Refresh Insights
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Collector Archetype Card */}
                {userArchetype ? (
                  <div className="flex justify-center">
                    <CollectorArchetypeCard archetype={userArchetype} />
                  </div>
                ) : (
                  <div className="text-center p-6 bg-gray-50 border border-gray-200 rounded-lg mx-4">
                    <p className="text-sm text-gray-600 mb-2">Discover your collector archetype!</p>
                    <p className="text-xs text-gray-500">Click "Refresh Insights" to analyze your collection and find out what type of collector you are.</p>
                  </div>
                )}

                {/* Collapsible Toggle Button */}
                <div className="flex justify-center">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsCollectionDetailsExpanded(!isCollectionDetailsExpanded)}
                    className="flex items-center gap-2"
                  >
                    {isCollectionDetailsExpanded ? (
                      <>
                        Hide Collection Insights
                        <ChevronUp className="h-4 w-4" />
                      </>
                    ) : (
                      <>
                        Show Collection Insights and Personalized Recommendations
                        <ChevronDown className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>

                {/* Expandable Content */}
                {isCollectionDetailsExpanded && (
                  <div className="space-y-6 animate-in slide-in-from-top-2 duration-300">
                    <Separator />

                    {/* AI-Generated Collection Summary */}
                    <div>
                      <h3 className="text-sm font-medium mb-3" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>Collection Overview</h3>
                      <p className="text-muted-foreground leading-relaxed">{insights.summary}</p>
                    </div>

                    {/* AI-Generated Collecting Pattern */}
                    {insights.collecting_pattern && (
                      <div>
                        <h3 className="text-sm font-medium mb-3" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>Collecting Pattern</h3>
                        <p className="text-muted-foreground leading-relaxed">{insights.collecting_pattern}</p>
                      </div>
                    )}

                    <Separator />

                    {/* Collection Statistics */}
                    <div>
                      <h3 className="text-sm font-medium mb-4" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>Collection Statistics</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                          <h4 className="text-sm font-medium mb-2">Top Artists</h4>
                        {insights.topArtists.length > 0 ? (
                          <ul className="list-disc pl-5 text-sm text-muted-foreground">
                            {insights.topArtists.map((artist: string) => (
                              <li key={artist}>{artist}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted-foreground">No artists in collection yet</p>
                        )}
                      </div>

                      <div>
                          <h4 className="text-sm font-medium mb-2">Preferred Styles</h4>
                        <div className="flex flex-wrap gap-2">
                          {insights.topTags.length > 0 ? (
                            insights.topTags.map((tag) => (
                              <Badge key={tag} variant="secondary">
                                {tag}
                              </Badge>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground">No styles in collection yet</p>
                          )}
                      </div>
                    </div>

                      <div>
                          <h4 className="text-sm font-medium mb-2">Preferred Mediums</h4>
                        {insights.preferredMediums.length > 0 ? (
                          <ul className="list-disc pl-5 text-sm text-muted-foreground">
                            {insights.preferredMediums.map((medium) => (
                              <li key={medium}>{medium}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted-foreground">No mediums in collection yet</p>
                        )}
                      </div>

                      <div>
                          <h4 className="text-sm font-medium mb-2">Price Range</h4>
                        <p className="text-sm text-muted-foreground">{insights.priceRange}</p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* AI-Generated Recommendations */}
                    <div>
                      <h3 className="text-sm font-medium mb-3" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>Personalized Recommendations</h3>
                      {insights.recommendations.length > 0 ? (
                        <ul className="space-y-2">
                          {insights.recommendations.map((recommendation, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <span className="text-primary mt-1">•</span>
                            <span className="text-black leading-relaxed">{recommendation}</span>
                          </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-muted-foreground">
                          Add artworks to your collection to get personalized recommendations
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {collection.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Heart className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-xl font-medium mb-2 text-black">Your collection is empty</h3>
              <p className="text-gray-600 mb-6">Start discovering art and add pieces you love!</p>
              <Button onClick={() => setView("discover")}>Start Discovering</Button>
            </div>
          ) : (
            <div className="space-y-6">
              {collection.map((artwork) => (
                <div key={artwork.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg cursor-pointer hover:shadow-xl transition-shadow duration-300">
                  <div onClick={() => handleArtworkTap(artwork)}>
                    {/* Artwork Image - Big Tile */}
                    <div className="w-full aspect-[4/3] relative">
                      <img
                        src={artwork.artwork_image || "/placeholder.svg"}
                        alt={artwork.title}
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedArtwork(artwork)
                          handleArtworkTap(artwork)
                        }}
                      />
                    </div>
                    
                    {/* Artwork Info */}
                    <div className="p-6">
                      <div className="mb-4">
                        <h3 className="font-bold text-black text-xl leading-tight mb-2">{artwork.title}</h3>
                        <ArtistNameWithBadge 
                          artistName={artwork.artist}
                          artistId={(artwork as any).artist_id}
                          className="text-gray-600 text-lg"
                        />
                        <p className="text-black font-medium text-base mt-2">{artwork.price}</p>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 border-gray-300 hover:bg-gray-50"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedArtwork(artwork)
                            setShowInfoModal(true)
                          }}
                        >
                          <Info className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation()
                            onRemoveFromCollection(artwork.id)
                          }}
                        >
                          <Trash className="w-4 h-4 mr-2" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mobile Menu Modal */}
        {showMenuModal && (
          <div
            className="fixed inset-0 bg-black/50 flex items-end z-[100]"
            onClick={() => setShowMenuModal(false)}
          >
            <div
              className="bg-white rounded-t-2xl p-6 w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-black">Menu</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowMenuModal(false)}
                  className="text-black hover:bg-gray-100 h-10 w-10"
                >
                  <X className="w-6 h-6" />
                  <span className="sr-only">Close menu</span>
                </Button>
              </div>
              <div className="space-y-4">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-black hover:bg-gray-100"
                  onClick={() => {
                    setView("discover")
                    setShowMenuModal(false)
                  }}
                >
                  <Search className="mr-3 h-5 w-5" />
                  Discover
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-black hover:bg-gray-100"
                  onClick={() => {
                    setView("collection")
                    setShowMenuModal(false)
                  }}
                >
                  <Heart className="mr-3 h-5 w-5" />
                  My Collection
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-black hover:bg-gray-100"
                  onClick={() => {
                    setView("for-artists")
                    setShowMenuModal(false)
                  }}
                >
                  <Palette className="mr-3 h-5 w-5" />
                  For Artists
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-black hover:bg-gray-100"
                  onClick={() => {
                    router.push("/about", { scroll: false })
                    setShowMenuModal(false)
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
                {/* Footer Links */}
                <div className="border-t border-gray-200 mt-4 pt-4">
                  <div className="space-y-2">
                    <button
                      className="w-full text-left text-sm text-gray-600 hover:text-gray-800 py-2"
                      onClick={() => {
                        setView("terms");
                        setShowMenuModal(false);
                      }}
                    >
                      Terms of Service
                    </button>
                    <button
                      className="w-full text-left text-sm text-gray-600 hover:text-gray-800 py-2"
                      onClick={() => {
                        setView("privacy");
                        setShowMenuModal(false);
                      }}
                    >
                      Privacy & Data Policy
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Artwork Info Modal */}
        {showInfoModal && selectedArtwork && (
          <div
            className="fixed inset-0 bg-black/50 flex items-end z-[100]"
            onClick={() => {
              setShowInfoModal(false)
              setSelectedArtwork(null)
            }}
          >
          <div
            className="bg-white rounded-t-2xl w-full max-h-[80vh] min-h-[50vh] overflow-y-auto overscroll-contain"
            style={{ WebkitOverflowScrolling: 'touch' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 pb-8">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-black">{selectedArtwork.title}</h2>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setShowInfoModal(false)
                      setSelectedArtwork(null)
                    }}
                    className="text-black hover:bg-gray-100 h-10 w-10"
                  >
                    <X className="w-6 h-6" />
                    <span className="sr-only">Close details</span>
                  </Button>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="font-semibold text-black">Artist:</span>
                    <span className="ml-2 text-gray-700">{selectedArtwork.artist}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-black">Price:</span>
                    <span className="ml-2 text-gray-700">{selectedArtwork.price}</span>
                  </div>
                  {selectedArtwork.medium && (
                    <div>
                      <span className="font-semibold text-black">Medium:</span>
                      <span className="ml-2 text-gray-700">{selectedArtwork.medium}</span>
                    </div>
                  )}
                  {selectedArtwork.dimensions && (
                    <div>
                      <span className="font-semibold text-black">Dimensions:</span>
                      <span className="ml-2 text-gray-700">{formatDimensions(selectedArtwork.dimensions)}</span>
                    </div>
                  )}
                  {selectedArtwork.description && (
                    <div>
                      <span className="font-semibold text-black">Description:</span>
                      <p className="mt-1 text-gray-700">{selectedArtwork.description}</p>
                    </div>
                  )}
                  
                  {/* Tags Section */}
                  {(() => {
                    const allTags = [
                      selectedArtwork.genre,
                      selectedArtwork.style,
                      selectedArtwork.subject,
                      selectedArtwork.colour,
                      ...(selectedArtwork.tags || [])
                    ].filter(
                      (tag, idx, arr) => tag && arr.indexOf(tag) === idx
                    )
                    
                    return allTags.length > 0 && (
                      <div>
                        <span className="font-semibold text-black">Tags:</span>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {allTags.map((tag) => (
                            <Badge key={tag} variant="secondary">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )
                  })()}
                </div>
                
                {/* Artist Website Button - Always Visible */}
                <div className="pt-4">
                  {(() => {
                    console.log('Rendering artist website button for artwork:', selectedArtwork.title);
                    console.log('Artwork object:', selectedArtwork);
                    console.log('Link property:', selectedArtwork.link);
                    console.log('Price property:', selectedArtwork.price);
                    
                    const hasValidLink = selectedArtwork.link && selectedArtwork.link.trim() !== '';
                    const hasPrice = selectedArtwork.price && selectedArtwork.price.trim() !== '' && selectedArtwork.price.toLowerCase() !== 'not for sale';
                    
                    console.log('Has valid link:', hasValidLink);
                    console.log('Has price:', hasPrice);
                    
                    // Determine button text and behavior
                    let buttonText = '';
                    let isClickable = false;
                    
                    if (hasValidLink) {
                      buttonText = 'View on artist\'s website';
                      isClickable = true;
                    } else if (hasPrice) {
                      buttonText = selectedArtwork.price;
                      isClickable = false;
                    } else {
                      buttonText = 'Not for sale';
                      isClickable = false;
                    }
                    
                    return (
                      <Button 
                        className={`w-full py-3 text-sm font-medium ${
                          isClickable
                            ? 'border border-black bg-white text-black hover:bg-black hover:text-white'
                            : 'bg-gray-200 text-gray-600 cursor-not-allowed'
                        } transition-all duration-200`}
                        disabled={!isClickable}
                        onClick={() => {
                          if (isClickable && hasValidLink && selectedArtwork.link) {
                            const linkUrl = selectedArtwork.link;
                            console.log('Artist website button clicked, link:', linkUrl);
                            // Validate and fix URL before opening
                            try {
                              let url = linkUrl.trim()
                              // Add https:// if no protocol is specified
                              if (!url.startsWith('http://') && !url.startsWith('https://')) {
                                url = 'https://' + url
                              }
                              // Validate the URL
                              new URL(url)
                              console.log('Opening URL:', url);
                              // On mobile, use location.href to avoid the K logo screen
                              window.location.href = url
                            } catch (error) {
                              console.error('Invalid artist URL:', linkUrl)
                              // Could show a toast message here if needed
                            }
                          }
                        }}
                      >
                        {buttonText}
                      </Button>
                    );
                  })()}
                </div>
                
                {/* Social Media Share Buttons */}
                <div className="pt-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-3">Share this artwork</p>
                    <div className="flex justify-center gap-2">
                      <button 
                        className="w-10 h-10 border border-black bg-white rounded-full flex items-center justify-center hover:bg-black hover:text-white transition-all duration-200"
                        onClick={() => {
                          const url = encodeURIComponent(window.location.href);
                          const text = encodeURIComponent(`Check out "${selectedArtwork.title}" by ${selectedArtwork.artist} on Kaleidorium`);
                          window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank', 'noopener,noreferrer');
                        }}
                        title="Share on X"
                      >
                        <XIcon className="w-5 h-5" />
                      </button>
                      <button 
                        className="w-10 h-10 border border-black bg-white rounded-full flex items-center justify-center hover:bg-black hover:text-white transition-all duration-200"
                        onClick={() => {
                          const url = encodeURIComponent(window.location.href);
                          const text = encodeURIComponent(`Check out "${selectedArtwork.title}" by ${selectedArtwork.artist} on Kaleidorium`);
                          window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`, '_blank', 'noopener,noreferrer');
                        }}
                        title="Share on Facebook"
                      >
                        <Facebook className="w-5 h-5" />
                      </button>
                      <button 
                        className="w-10 h-10 border border-black bg-white rounded-full flex items-center justify-center hover:bg-black hover:text-white transition-all duration-200"
                        onClick={() => {
                          const url = encodeURIComponent(window.location.href);
                          const text = encodeURIComponent(`Check out "${selectedArtwork.title}" by ${selectedArtwork.artist} on Kaleidorium`);
                          window.open(`https://www.instagram.com/`, '_blank', 'noopener,noreferrer');
                        }}
                        title="Share on Instagram"
                      >
                        <Instagram className="w-5 h-5" />
                      </button>
                      <button 
                        className="w-10 h-10 border border-black bg-white rounded-full flex items-center justify-center hover:bg-black hover:text-white transition-all duration-200"
                        onClick={() => {
                          const url = encodeURIComponent(window.location.href);
                          const text = encodeURIComponent(`Check out "${selectedArtwork.title}" by ${selectedArtwork.artist} on Kaleidorium`);
                          window.open(`https://wa.me/?text=${text}%20${url}`, '_blank', 'noopener,noreferrer');
                        }}
                        title="Share on WhatsApp"
                      >
                        <MessageCircle className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Scroll indicator */}
              <div className="text-center text-xs text-gray-400 py-2">
                Scroll for more
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Discovery View - CardStack
  if (visibleArtworks.length === 0) {
    return (
      <div className={getContainerClasses()}>
        <div className="flex items-center justify-center h-full">
          <p className="text-black text-xl">No more artworks to discover!</p>
        </div>
      </div>
    )
  }

  return (
    <div className={getContainerClasses()}>
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-white border-b border-gray-200 z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowMenuModal(true)}
          className="text-black hover:bg-gray-100"
        >
          <Menu className="w-6 h-6" />
        </Button>
        <h1 className="font-serif text-xl font-semibold text-black flex items-center space-x-2">
          <img 
            src="/logos/logo-mobile-20x20.svg" 
            alt="Kaleidorium Logo" 
            className="w-5 h-5"
          />
          Kaleidorium
        </h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setView("profile")}
          className="text-black hover:bg-gray-100"
        >
          <User className="w-6 h-6" />
        </Button>
      </div>

      {/* Main Artwork Area - Scrollable CardStack */}
      <div className={getMainAreaClasses()}>
        <div 
          ref={containerRef}
          className="h-full overflow-y-auto p-4 space-y-4"
        >
          {visibleArtworks.map((artwork, index) => (
            <div
              key={artwork.id}
              ref={(el) => {
                cardRefs.current[artwork.id] = el
              }}
              className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 ease-out transform hover:scale-[1.01] overflow-hidden"
              onTouchStart={(e) => handleTouchStart(e, artwork.id)}
              onTouchMove={(e) => handleTouchMove(e, artwork.id)}
              onTouchEnd={() => handleTouchEnd(artwork.id, artwork)}
              style={{ willChange: 'transform' }}
            >
              {/* Artwork Image */}
              <div 
                className="relative w-full h-96 cursor-pointer"
                onClick={() => handleArtworkTap(artwork)}
              >
                <Image
                  src={artwork.artwork_image}
                  alt={artwork.title}
                  fill
                  className="object-cover transition-opacity duration-300"
                  sizes="100vw"
                  priority={index < 3}
                />
                
                {/* Tap indicator overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
                  <div className="bg-black/50 rounded-full p-3 backdrop-blur-sm">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </div>
                </div>

              </div>

              {/* Simplified Artwork Information */}
              <div className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h2 className="text-lg font-bold text-black mb-1">{artwork.title}</h2>
                    <ArtistNameWithBadge 
                      artistName={artwork.artist}
                      artistId={(artwork as any).artist_id}
                      className="text-base text-gray-600"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-center gap-6">
            <Button
              size="icon"
              className={`group w-16 h-16 min-w-16 min-h-16 rounded-full border border-black p-0 aspect-square flex items-center justify-center
                transition-all duration-200 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg
                ${buttonStates.dislike ? 'bg-black scale-95' : 'bg-white hover:bg-black'}`}
              onClick={() => handleButtonAction('dislike', artwork)}
              disabled={isAnimating}
            >
              <ThumbsDown className={`w-9 h-9 transition-colors duration-200 ${
                buttonStates.dislike ? 'text-white' : 'text-black group-hover:text-white'
              }`} />
            </Button>
            
            <Button
              size="icon"
              className={`group w-16 h-16 min-w-16 min-h-16 rounded-full border border-black p-0 aspect-square flex items-center justify-center
                transition-all duration-200 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg
                ${buttonStates.info ? 'bg-black scale-95' : 'bg-white hover:bg-black'}`}
              onClick={() => handleButtonAction('info', artwork)}
              disabled={isAnimating}
            >
              <Info className={`w-9 h-9 transition-colors duration-200 ${
                buttonStates.info ? 'text-white' : 'text-black group-hover:text-white'
              }`} />
            </Button>
            
            <Button
              size="icon"
              className={`group w-16 h-16 min-w-16 min-h-16 rounded-full border border-black p-0 aspect-square flex items-center justify-center
                transition-all duration-200 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg
                ${buttonStates.add ? 'bg-black scale-95 animate-pulse' : 'bg-white hover:bg-black'}`}
              onClick={() => handleButtonAction('add', artwork)}
              disabled={isAnimating}
            >
              <Heart className={`w-9 h-9 transition-colors duration-200 ${
                buttonStates.add ? 'text-white' : 'text-black group-hover:text-white'
              }`} />
            </Button>
            
            <Button
              size="icon"
              className={`group w-16 h-16 min-w-16 min-h-16 rounded-full border border-black p-0 aspect-square flex items-center justify-center
                transition-all duration-200 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg
                ${buttonStates.like ? 'bg-black scale-95' : 'bg-white hover:bg-black'}`}
              onClick={() => handleButtonAction('like', artwork)}
              disabled={isAnimating}
            >
              <ThumbsUp className={`w-9 h-9 transition-colors duration-200 ${
                buttonStates.like ? 'text-white' : 'text-black group-hover:text-white'
              }`} />
            </Button>
                </div>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {visibleCardCount < artworks.length && (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
          )}
          
          {/* Fallback message when no filters match */}
          {showFallbackMessage && (
            <div className="mt-8 text-center p-6 bg-blue-50 border border-blue-200 rounded-lg mx-4">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">No more artwork matching your criteria</h3>
              <p className="text-sm text-blue-600">
                Remove some of the filters you selected or come back soon as we are always adding new artwork.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filter Panel */}
      {showFilters && (view === "discover" || (!view)) && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-end">
          <div className="bg-white rounded-t-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-black">Filters</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilters(false)}
                  className="text-black hover:bg-gray-100"
                >
                  ×
                </Button>
              </div>
              
              <div className="space-y-6">
                {/* Style Filter */}
                <div className="relative">
                  <label className="block text-sm font-bold mb-2">Style</label>
                  
                  {/* Selected tags display */}
                  {filters.style.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {filters.style.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="text-xs font-normal cursor-pointer hover:bg-red-100"
                          onClick={() => removeFilterTag('style', tag)}
                        >
                          {tag} ×
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  <input
                    type="text"
                    placeholder="e.g. Abstract, Portrait, Digital Art..."
                    value={inputValues.style}
                    onChange={(e) => handleInputChange('style', e.target.value)}
                    onFocus={() => setShowAutocomplete(prev => ({ ...prev, style: true }))}
                    onBlur={() => setTimeout(() => setShowAutocomplete(prev => ({ ...prev, style: false })), 200)}
                    className="w-full p-3 border border-gray-300 rounded-md mb-2"
                  />
                  
                  {/* Autocomplete dropdown */}
                  {showAutocomplete.style && (
                    <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto">
                      {getFilteredSuggestions('style', inputValues.style).map((suggestion: string) => (
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
                  
                  <div className="flex flex-wrap gap-2">
                    {EXAMPLE_TAGS.style.slice(0, 5).map((tag: string) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className={`cursor-pointer hover:bg-gray-200 text-xs font-normal ${
                          filters.style.includes(tag) ? 'bg-blue-100 border-blue-300' : ''
                        }`}
                        onClick={() => addFilterTag('style', tag)}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Subject Filter */}
                <div className="relative">
                  <label className="block text-sm font-bold mb-2">Subject</label>
                  
                  {/* Selected tags display */}
                  {filters.subject.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {filters.subject.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="text-xs font-normal cursor-pointer hover:bg-red-100"
                          onClick={() => removeFilterTag('subject', tag)}
                        >
                          {tag} ×
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  <input
                    type="text"
                    placeholder="e.g. Nature, Urban, Portrait..."
                    value={inputValues.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                    onFocus={() => setShowAutocomplete(prev => ({ ...prev, subject: true }))}
                    onBlur={() => setTimeout(() => setShowAutocomplete(prev => ({ ...prev, subject: false })), 200)}
                    className="w-full p-3 border border-gray-300 rounded-md mb-2"
                  />
                  
                  {/* Autocomplete dropdown */}
                  {showAutocomplete.subject && (
                    <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto">
                      {getFilteredSuggestions('subject', inputValues.subject).map((suggestion: string) => (
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
                  
                  <div className="flex flex-wrap gap-2">
                    {EXAMPLE_TAGS.subject.slice(0, 5).map((tag: string) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className={`cursor-pointer hover:bg-gray-200 text-xs font-normal ${
                          filters.subject.includes(tag) ? 'bg-blue-100 border-blue-300' : ''
                        }`}
                        onClick={() => addFilterTag('subject', tag)}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Colors Filter */}
                <div className="relative">
                  <label className="block text-sm font-bold mb-2">Colors</label>
                  
                  {/* Selected tags display */}
                  {filters.colors.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {filters.colors.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="text-xs font-normal cursor-pointer hover:bg-red-100"
                          onClick={() => removeFilterTag('colors', tag)}
                        >
                          {tag} ×
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  <input
                    type="text"
                    placeholder="e.g. Black, Colorful, Warm tones..."
                    value={inputValues.colors}
                    onChange={(e) => handleInputChange('colors', e.target.value)}
                    onFocus={() => setShowAutocomplete(prev => ({ ...prev, colors: true }))}
                    onBlur={() => setTimeout(() => setShowAutocomplete(prev => ({ ...prev, colors: false })), 200)}
                    className="w-full p-3 border border-gray-300 rounded-md mb-2"
                  />
                  
                  {/* Autocomplete dropdown */}
                  {showAutocomplete.colors && (
                    <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto">
                      {getFilteredSuggestions('colors', inputValues.colors).map((suggestion: string) => (
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
                  
                  <div className="flex flex-wrap gap-2">
                    {EXAMPLE_TAGS.colors.slice(0, 5).map((tag: string) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className={`cursor-pointer hover:bg-gray-200 text-xs font-normal ${
                          filters.colors.includes(tag) ? 'bg-blue-100 border-blue-300' : ''
                        }`}
                        onClick={() => addFilterTag('colors', tag)}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Filter Action Buttons */}
              <div className="flex gap-4 mt-8">
                <Button 
                  className="flex-1 bg-black text-white hover:bg-gray-800"
                  onClick={applyFilters}
                >
                  Apply Filters
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={clearFilters}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Menu Modal */}
      {showMenuModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-[100]">
          <div className="bg-white rounded-t-2xl p-6 w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-black">Menu</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMenuModal(false)}
                className="text-black hover:bg-gray-100"
              >
                ×
              </Button>
            </div>
            <div className="space-y-4">
              <Button
                variant="ghost"
                className="w-full justify-start text-black hover:bg-gray-100"
                onClick={() => {
                  setView("discover")
                  setShowMenuModal(false)
                }}
              >
                <Search className="mr-3 h-5 w-5" />
                Discover
              </Button>
              
              {/* Mobile Filter Button - Only show on discover page */}
              {(view === "discover" || (!view)) && (
                <Button
                  variant="ghost"
                  className="w-full justify-start text-black hover:bg-gray-100"
                  onClick={() => {
                    setShowFilters(!showFilters)
                    setShowMenuModal(false)
                  }}
                >
                  <Search className="mr-3 h-5 w-5" />
                  Filters
                </Button>
              )}
              <Button
                variant="ghost"
                className="w-full justify-start text-black hover:bg-gray-100"
                onClick={() => {
                  setView("collection")
                  setShowMenuModal(false)
                }}
              >
                <Heart className="mr-3 h-5 w-5" />
                My Collection
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-black hover:bg-gray-100"
                onClick={() => {
                  setView("for-artists")
                  setShowMenuModal(false)
                }}
              >
                <Palette className="mr-3 h-5 w-5" />
                For Artists
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-black hover:bg-gray-100"
                onClick={() => {
                  router.push("/about", { scroll: false })
                  setShowMenuModal(false)
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
              {/* Footer Links */}
              <div className="border-t border-gray-200 mt-4 pt-4">
                <div className="space-y-2">
                  <button
                    className="w-full text-left text-sm text-gray-600 hover:text-gray-800 py-2"
                    onClick={() => {
                      setView("terms");
                      setShowMenuModal(false);
                    }}
                  >
                    Terms of Service
                  </button>
                  <button
                    className="w-full text-left text-sm text-gray-600 hover:text-gray-800 py-2"
                    onClick={() => {
                      setView("privacy");
                      setShowMenuModal(false);
                    }}
                  >
                    Privacy & Data Policy
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Artwork Info Modal */}
      {showInfoModal && selectedArtwork && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-[100]">
          <div className="bg-white rounded-t-2xl w-full max-h-[90vh] overflow-y-auto overscroll-contain" style={{WebkitOverflowScrolling: 'touch'}}>
            <div className="p-6 pb-8 min-h-[600px]">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-black">{selectedArtwork.title}</h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowInfoModal(false)
                    setSelectedArtwork(null)
                  }}
                  className="text-black hover:bg-gray-100"
                >
                  ×
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <span className="font-semibold text-black">Artist:</span>
                  <span className="ml-2 text-gray-700">{selectedArtwork.artist}</span>
                </div>
                
                {selectedArtwork.medium && (
                  <div>
                    <span className="font-semibold text-black">Medium:</span>
                    <span className="ml-2 text-gray-700">{selectedArtwork.medium}</span>
                  </div>
                )}
                
                {selectedArtwork.dimensions && (
                  <div>
                    <span className="font-semibold text-black">Dimensions:</span>
                    <span className="ml-2 text-gray-700">{selectedArtwork.dimensions}</span>
                  </div>
                )}
                
                {selectedArtwork.year && (
                  <div>
                    <span className="font-semibold text-black">Year:</span>
                    <span className="ml-2 text-gray-700">{selectedArtwork.year}</span>
                  </div>
                )}
                
                {selectedArtwork.description && (
                  <div>
                    <span className="font-semibold text-black">Description:</span>
                    <p className="mt-1 text-gray-700">{selectedArtwork.description}</p>
                  </div>
                )}
                
                {/* Tags Section */}
                {(() => {
                  const allTags = [
                    selectedArtwork.genre,
                    selectedArtwork.style,
                    selectedArtwork.subject,
                    selectedArtwork.colour,
                    ...(selectedArtwork.tags || [])
                  ].filter(
                    (tag, idx, arr) => tag && arr.indexOf(tag) === idx
                  )
                  
                  return allTags.length > 0 && (
                    <div>
                      <span className="font-semibold text-black">Style & Subject:</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {allTags.map((tag) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )
                })()}
                
                {/* Artist Website Button */}
                <div className="pt-4">
                  <Button 
                    className={`w-full py-3 text-sm font-medium ${
                      selectedArtwork.link && selectedArtwork.link.trim() !== ''
                        ? 'border border-black bg-white text-black hover:bg-black hover:text-white'
                        : 'bg-gray-200 text-gray-600 cursor-not-allowed'
                    } transition-all duration-200`}
                    disabled={!selectedArtwork.link || selectedArtwork.link.trim() === ''}
                    onClick={() => {
                      console.log('Artist website button clicked, link:', selectedArtwork.link);
                      if (selectedArtwork.link && selectedArtwork.link.trim() !== '') {
                        // Validate and fix URL before opening
                        try {
                          let url = selectedArtwork.link.trim()
                          // Add https:// if no protocol is specified
                          if (!url.startsWith('http://') && !url.startsWith('https://')) {
                            url = 'https://' + url
                          }
                          // Validate the URL
                          new URL(url)
                          console.log('Opening URL:', url);
                          // On mobile, use location.href to avoid the K logo screen
                          window.location.href = url
                        } catch (error) {
                          console.error('Invalid artist URL:', selectedArtwork.link)
                          // Could show a toast message here if needed
                        }
                      }
                    }}
                  >
                    {selectedArtwork.link && selectedArtwork.link.trim() !== '' 
                      ? 'View on artist\'s website' 
                      : 'Not for sale'
                    }
                  </Button>
                </div>
                
                {/* Social Media Share Buttons */}
                <div className="pt-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-3">Share this artwork</p>
                    <div className="flex justify-center gap-2">
                      <button 
                        className="w-10 h-10 border border-black bg-white rounded-full flex items-center justify-center hover:bg-black hover:text-white transition-all duration-200"
                        onClick={() => {
                          const url = encodeURIComponent(window.location.href);
                          const text = encodeURIComponent(`Check out "${selectedArtwork.title}" by ${selectedArtwork.artist} on Kaleidorium`);
                          window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank', 'noopener,noreferrer');
                        }}
                        title="Share on X"
                      >
                        <XIcon className="w-5 h-5" />
                      </button>
                      <button 
                        className="w-10 h-10 border border-black bg-white rounded-full flex items-center justify-center hover:bg-black hover:text-white transition-all duration-200"
                        onClick={() => {
                          const url = encodeURIComponent(window.location.href);
                          const text = encodeURIComponent(`Check out "${selectedArtwork.title}" by ${selectedArtwork.artist} on Kaleidorium`);
                          window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`, '_blank', 'noopener,noreferrer');
                        }}
                        title="Share on Facebook"
                      >
                        <Facebook className="w-5 h-5" />
                      </button>
                      <button 
                        className="w-10 h-10 border border-black bg-white rounded-full flex items-center justify-center hover:bg-black hover:text-white transition-all duration-200"
                        onClick={() => {
                          const url = encodeURIComponent(window.location.href);
                          const text = encodeURIComponent(`Check out "${selectedArtwork.title}" by ${selectedArtwork.artist} on Kaleidorium`);
                          window.open(`https://www.instagram.com/`, '_blank', 'noopener,noreferrer');
                        }}
                        title="Share on Instagram"
                      >
                        <Instagram className="w-5 h-5" />
                      </button>
                      <button 
                        className="w-10 h-10 border border-black bg-white rounded-full flex items-center justify-center hover:bg-black hover:text-white transition-all duration-200"
                        onClick={() => {
                          const url = encodeURIComponent(window.location.href);
                          const text = encodeURIComponent(`Check out "${selectedArtwork.title}" by ${selectedArtwork.artist} on Kaleidorium`);
                          window.open(`https://wa.me/?text=${text}%20${url}`, '_blank', 'noopener,noreferrer');
                        }}
                        title="Share on WhatsApp"
                      >
                        <MessageCircle className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Scroll indicator */}
              <div className="text-center text-xs text-gray-400 py-2">
                Scroll for more
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full-Screen Artwork Overlay */}
      {showFullscreenArtwork && selectedArtwork && (
        <div className="fixed inset-0 bg-gray-100 z-[200] flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center">
            {!fullscreenImageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
              </div>
            )}
            <img
              src={selectedArtwork.artwork_image}
              alt={selectedArtwork.title}
              className={`max-w-full max-h-full object-contain transition-opacity duration-500 ${
                fullscreenImageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setFullscreenImageLoaded(true)}
              onError={() => setFullscreenImageLoaded(true)}
            />
          </div>

          {/* Tap anywhere to close */}
          <div 
            className="absolute inset-0 cursor-pointer" 
            onClick={handleFullscreenClose}
          />
        </div>
      )}
    </div>
  )
}
