"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { Heart, Info, Menu, Search, Palette, Mail, User, Facebook, Instagram, MessageCircle, Trash, RefreshCw, ChevronDown, ChevronUp, X, Copy, BadgeAlert, Sparkles, Building2 } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import type { Artwork } from "@/types/artwork"
import { ArtistNameWithBadge } from "@/components/artist-name-with-badge"
import { KaleidoriumWordmark } from "@/components/kaleidorium-wordmark"
import { KuratorBanner } from "@/components/kurator-banner"
import { KuratorInsight, KuratorEarlyEncouragement } from "@/components/kurator-insight"

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

interface LocalPreferences {
  artists: Record<string, number>
  genres: Record<string, number>
  styles: Record<string, number>
  subjects: Record<string, number>
  colors: Record<string, number>
  priceRanges: Record<string, number>
  interactionCount: number
  viewed_artworks: string[]
}

interface MobileCardStackProps {
  artworks: Artwork[]
  onLike: (artwork: Artwork) => void
  onDislike: (artwork: Artwork) => void
  onAddToCollection: (artwork: Artwork) => void | Promise<void | boolean>
  onLoadMore: () => void
  setView: (view: "discover" | "collection" | "featured" | "taste-profile" | "profile" | "why-kaleidorium" | "for-artists" | "for-galleries" | "about" | "contact" | "pricing" | "terms" | "privacy") => void
  view: "discover" | "collection"
  collection: Artwork[]
  onRemoveFromCollection: (id: string) => void
  onFilterChange?: (filters: { style: string[], subject: string[], colors: string[] }) => void
  onClearFilters?: () => void
  showFallbackMessage?: boolean
  fallbackMessage?: string
  isLandscape?: boolean
  isPortrait?: boolean
  screenWidth?: number
  screenHeight?: number
  localPreferences?: LocalPreferences
  isRegistered?: boolean
  newArtworkCount?: number
  lastVisitDate?: string | null
  discoverSearchBar?: React.ReactNode
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
  fallbackMessage,
  isLandscape = false,
  isPortrait = true,
  screenWidth = 0,
  screenHeight = 0,
  localPreferences,
  isRegistered = false,
  newArtworkCount = 0,
  lastVisitDate,
  discoverSearchBar,
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
  const [showGestureIntro, setShowGestureIntro] = useState(false)
  const [showButtonOnboarding, setShowButtonOnboarding] = useState(false)
  const [currentOnboardingStep, setCurrentOnboardingStep] = useState<'dislike' | 'info' | 'like' | null>(null)
  
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
    like: boolean
  }>({
    dislike: false,
    info: false,
    like: false
  })

  const containerRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  const actionPendingRef = useRef(false)
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
      return "flex-1 relative overflow-hidden bg-[#FAFAF8]"
    }
    return "flex-1 relative overflow-hidden bg-[#FAFAF8]"
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

  const handleTouchEnd = async (artworkId: string, artwork: Artwork) => {
    if (!isDragging.current || showInfoModal || isAnimating) return
    
    isDragging.current = false
    const distance = Math.abs(currentX.current)
    
    if (distance > 100) {
      // Horizontal swipe - execute action immediately for better UX
      setIsAnimating(true)
      
      // Execute action immediately without waiting for animation
      if (currentX.current > 0) {
        // Swipe right - like (also adds to collection via handler)
        await onLike(artwork)
        toast({
          title: "Added to your collection",
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

  // Enhanced button action handler with micro-interactions
const handleButtonAction = async (action: 'like' | 'dislike' | 'info', artwork: Artwork) => {
    if (action !== 'info' && actionPendingRef.current) return
    if (action !== 'info') actionPendingRef.current = true

    // Trigger haptic feedback if available
    if (navigator.vibrate) {
      navigator.vibrate(50)
    }

    // Button animation
    setButtonStates(prev => ({ ...prev, [action]: true }))
    setTimeout(() => {
      setButtonStates(prev => ({ ...prev, [action]: false }))
    }, 200)

    try {
      switch (action) {
        case 'like': {
          await onLike(artwork)
          toast({
            title: "Added to your collection",
            description: `"${artwork.title}" by ${artwork.artist}`,
          })
          break
        }
        case 'dislike':
          await onDislike(artwork)
          toast({
            title: "Disliked!",
            description: `"${artwork.title}" by ${artwork.artist}`,
          })
          break
        case 'info':
          setSelectedArtwork(artwork)
          setShowInfoModal(true)
          break
      }
    } finally {
      if (action !== 'info') actionPendingRef.current = false
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

  const handleLogoClick = () => {
    setShowMenuModal(false)
    setView("discover")
    router.push("/", { scroll: false })
  }

  useEffect(() => {
    if (typeof window === "undefined") return
    const hasSeenIntro = localStorage.getItem("kaleidorium_swipe_intro_seen")
    if (hasSeenIntro) return // Already seen, don't show again
    
    let gestureTimer: NodeJS.Timeout | null = null
    let autoDismissTimer: NodeJS.Timeout | null = null
    let checkInterval: NodeJS.Timeout | null = null
    
    const showGestureIntroAfterDelay = () => {
      // Clear any existing timers
      if (gestureTimer) clearTimeout(gestureTimer)
      if (autoDismissTimer) clearTimeout(autoDismissTimer)
      
      // Wait 3 seconds after install prompt dismissal before showing gesture intro
      gestureTimer = setTimeout(() => {
        setShowGestureIntro(true)
        // Auto-dismiss after 5 seconds
        autoDismissTimer = setTimeout(() => {
          setShowGestureIntro(false)
          localStorage.setItem("kaleidorium_swipe_intro_seen", "true")
        }, 5000)
      }, 3000)
    }
    
    // Check if install prompt has already been interacted with
    const installPromptInteracted = localStorage.getItem('pwa-prompt-interacted')
    const installPromptDismissed = localStorage.getItem('pwa-prompt-dismissed')
    
    if (installPromptInteracted === 'true' || installPromptDismissed) {
      // Install prompt was already dismissed, show gesture intro after delay
      showGestureIntroAfterDelay()
    } else {
      // Install prompt hasn't been dismissed yet, wait for it
      // Check periodically
      checkInterval = setInterval(() => {
        const interacted = localStorage.getItem('pwa-prompt-interacted')
        if (interacted === 'true') {
          if (checkInterval) clearInterval(checkInterval)
          showGestureIntroAfterDelay()
        }
      }, 500)
      
      // Also listen for the custom event (faster response)
      const handleInstallPromptDismissed = () => {
        if (checkInterval) clearInterval(checkInterval)
        showGestureIntroAfterDelay()
      }
      
      window.addEventListener('pwa-prompt-dismissed', handleInstallPromptDismissed)
      
      return () => {
        if (gestureTimer) clearTimeout(gestureTimer)
        if (autoDismissTimer) clearTimeout(autoDismissTimer)
        if (checkInterval) clearInterval(checkInterval)
        window.removeEventListener('pwa-prompt-dismissed', handleInstallPromptDismissed)
      }
    }
    
    return () => {
      if (gestureTimer) clearTimeout(gestureTimer)
      if (autoDismissTimer) clearTimeout(autoDismissTimer)
      if (checkInterval) clearInterval(checkInterval)
    }
  }, [])

  const dismissGestureIntro = () => {
    setShowGestureIntro(false)
    try {
      localStorage.setItem("kaleidorium_swipe_intro_seen", "true")
    } catch (error) {
      console.error("Failed to persist intro state", error)
    }
  }

  // Check if user has completed button onboarding
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const onboardingCompleted =
        localStorage.getItem('discover-onboarding-completed') ||
        localStorage.getItem('mobile-button-onboarding-completed')
      if (!onboardingCompleted && view === 'discover' && artworks.length > 0) {
        // Wait a bit after page load, then show onboarding
        const timer = setTimeout(() => {
          setShowButtonOnboarding(true)
          setCurrentOnboardingStep('dislike')
        }, 1500)
        return () => clearTimeout(timer)
      }
    }
  }, [view, artworks.length])

  const dismissButtonOnboarding = () => {
    setShowButtonOnboarding(false)
    setCurrentOnboardingStep(null)
    if (typeof window !== 'undefined') {
      localStorage.setItem('discover-onboarding-completed', 'true')
      localStorage.setItem('mobile-button-onboarding-completed', 'true')
    }
  }

  const nextOnboardingStep = () => {
    if (currentOnboardingStep === 'dislike') {
      setCurrentOnboardingStep('info')
    } else if (currentOnboardingStep === 'info') {
      setCurrentOnboardingStep('like')
    } else if (currentOnboardingStep === 'like') {
      dismissButtonOnboarding()
    }
  }

  const ONBOARDING_PURPLE = '#3D2A6B'

  // Button Onboarding Overlay - Shows tooltips for each button (small windows, no full-screen backdrop)
  const buttonOnboardingOverlay = showButtonOnboarding && view === "discover" && currentOnboardingStep ? (
    <div className="fixed inset-0 z-[160] pointer-events-none" style={{ zIndex: 160 }}>
      {currentOnboardingStep === 'dislike' && (
        <div className="absolute bottom-32 left-[calc(50%-40px)] transform -translate-x-1/2 pointer-events-auto" style={{ zIndex: 170 }}>
          <div
            className="rounded-lg px-4 py-3 shadow-2xl max-w-[260px] relative border border-white/20 onboarding-tooltip"
            style={{ backgroundColor: ONBOARDING_PURPLE, color: '#ffffff' }}
          >
            <div className="flex items-start gap-2">
              <X className="w-5 h-5 flex-shrink-0 mt-0.5" strokeWidth={2.25} />
              <div className="flex-1">
                <p className="font-semibold mb-1 text-sm">Dislike</p>
                <p className="text-xs leading-relaxed">
                  Dislike or swipe left to see fewer artworks like this
                </p>
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <button
                className="text-xs font-semibold underline hover:no-underline"
                onClick={nextOnboardingStep}
              >
                Next →
              </button>
            </div>
          </div>
          <div
            className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent"
            style={{ borderTopColor: ONBOARDING_PURPLE }}
          />
        </div>
      )}

      {currentOnboardingStep === 'info' && (
        <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 pointer-events-auto" style={{ zIndex: 170 }}>
          <div
            className="rounded-lg px-4 py-3 shadow-2xl max-w-[260px] relative border border-white/20 onboarding-tooltip"
            style={{ backgroundColor: ONBOARDING_PURPLE, color: '#ffffff' }}
          >
            <div className="flex items-start gap-2">
              <Info className="w-5 h-5 flex-shrink-0 mt-0.5" strokeWidth={2} />
              <div className="flex-1">
                <p className="font-semibold mb-1 text-sm">Info</p>
                <p className="text-xs leading-relaxed">
                  Tap Info to learn more about an artwork
                </p>
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <button
                className="text-xs font-semibold underline hover:no-underline"
                onClick={nextOnboardingStep}
              >
                Next →
              </button>
            </div>
          </div>
          <div
            className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent"
            style={{ borderTopColor: ONBOARDING_PURPLE }}
          />
        </div>
      )}

      {currentOnboardingStep === 'like' && (
        <div className="absolute bottom-32 left-[calc(50%+96px)] transform -translate-x-1/2 pointer-events-auto" style={{ zIndex: 170 }}>
          <div
            className="rounded-lg px-4 py-3 shadow-2xl max-w-[260px] relative border border-white/20 onboarding-tooltip"
            style={{ backgroundColor: ONBOARDING_PURPLE, color: '#ffffff' }}
          >
            <div className="flex items-start gap-2">
              <Heart className="w-5 h-5 flex-shrink-0 mt-0.5" strokeWidth={2} />
              <div className="flex-1">
                <p className="font-semibold mb-1 text-sm">Like</p>
                <p className="text-xs leading-relaxed">
                  Like or swipe right to add it to your collection
                </p>
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <button
                className="text-xs font-semibold underline hover:no-underline"
                onClick={dismissButtonOnboarding}
              >
                Got it ✓
              </button>
            </div>
          </div>
          <div
            className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent"
            style={{ borderTopColor: ONBOARDING_PURPLE }}
          />
        </div>
      )}
    </div>
  ) : null

  // Discovery View - Gesture Intro Overlay (positioned near buttons)
  // DISABLED: Replaced by button onboarding overlays
  const gestureIntroOverlay = false && showGestureIntro && view === "discover" ? (
    <div
      className="fixed inset-0 z-[150] pointer-events-none"
    >
      {/* Position instructions near the actual button locations */}
      {/* Buttons are in a flex container with justify-center and gap-6, roughly at 30%, 50%, 70% */}
      {/* Swipe left instruction - positioned near dislike button (left side, ~30% from left) */}
      <div className="absolute bottom-36 left-[30%] transform -translate-x-1/2">
        <div className="bg-[#3D2A6B] text-white text-xs font-sans rounded-full px-3 py-2 flex items-center gap-2 animate-in fade-in slide-in-from-bottom duration-500 shadow-lg whitespace-nowrap">
          <X className="w-3.5 h-3.5 text-white flex-shrink-0" />
          <span>Swipe left to pass</span>
        </div>
      </div>
      
      {/* Tap for details instruction - positioned near info button (center, ~50%) */}
      <div className="absolute bottom-36 left-1/2 transform -translate-x-1/2">
        <div className="bg-[#3D2A6B] text-white text-xs font-sans rounded-full px-3 py-2 flex items-center gap-2 animate-in fade-in slide-in-from-bottom duration-500 delay-200 shadow-lg whitespace-nowrap">
          <Info className="w-3.5 h-3.5 text-white flex-shrink-0" />
          <span>Tap for details</span>
        </div>
      </div>
      
      {/* Swipe right instruction - positioned near like button (right side, ~70% from left) */}
      <div className="absolute bottom-36 left-[70%] transform -translate-x-1/2">
        <div className="bg-[#3D2A6B] text-white text-xs font-sans rounded-full px-3 py-2 flex items-center gap-2 animate-in fade-in slide-in-from-bottom duration-500 delay-300 shadow-lg whitespace-nowrap">
          <Heart className="w-3.5 h-3.5 text-white flex-shrink-0" />
          <span>Swipe right to like</span>
        </div>
      </div>
      
      {/* Dismiss button - centered at bottom */}
      <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2">
        <button
          className="pointer-events-auto bg-white text-[#1E1E1C] text-xs font-semibold px-6 py-2.5 rounded-[12px] border border-[#E6E4DF] hover:bg-[#FAFAF8] transition-colors"
          onClick={dismissGestureIntro}
        >
          Got it
        </button>
      </div>
    </div>
  ) : null

  if (view === "collection") {
    return (
      <div className={getContainerClasses()}>
        {buttonOnboardingOverlay}
        {gestureIntroOverlay}
        {/* Header */}
        <div className="flex justify-between items-center p-4 bg-white border-b border-[#E6E4DF]">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowMenuModal(true)}
            className="text-[#1E1E1C] hover:bg-[#FAFAF8]"
          >
            <Menu className="w-6 h-6" />
          </Button>
          {/* Logo — bare brand signature, no button chrome */}
          <button
            onClick={handleLogoClick}
            className="flex items-center flex-shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D9CFF7] rounded-[6px]"
            aria-label="Kaleidorium — go to Discover"
          >
            <KaleidoriumWordmark size="mobile" />
          </button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setView("profile")}
            className="text-[#1E1E1C] hover:bg-[#FAFAF8]"
          >
            <User className="w-6 h-6" />
          </Button>
        </div>

        {/* Collection Content */}
        <div className="flex-1 overflow-y-auto p-4" ref={containerRef}>
          {collection.length > 0 && (
            <div className="mb-4">
              <h2 className="text-base font-bold text-gray-900">Your Collection ({collection.length})</h2>
            </div>
          )}

          {collection.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
              <div className="w-20 h-20 mb-6 rounded-full bg-[#FAFAF8] border border-[#E6E4DF] flex items-center justify-center">
                <Heart className="h-9 w-9 text-[#1E1E1C]" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-bold text-[#1E1E1C] mb-2">Your collection is empty</h3>
              <p className="text-[#5F5F5A] max-w-xs mb-6 text-sm leading-relaxed">
                Like an artwork to add it to your collection. Tap the Like button on any piece you love while
                discovering, and it will appear here.
              </p>
              <Button onClick={() => setView("discover")}>Discover Artwork</Button>
            </div>
          ) : (
            <div className="space-y-6">
              {collection.map((artwork) => (
                <div key={artwork.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                    {/* Artwork Image - tap for full-size overlay */}
                    <div
                      className="w-full aspect-[4/3] relative cursor-zoom-in"
                      onClick={() => handleArtworkTap(artwork)}
                      role="button"
                      tabIndex={0}
                      aria-label={`View ${artwork.title} full size`}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault()
                          handleArtworkTap(artwork)
                        }
                      }}
                    >
                      <img
                        src={artwork.artwork_image || "/placeholder.svg"}
                        alt={artwork.title}
                        className="w-full h-full object-cover"
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
                          size="sm"
                          className="flex-1 bg-[#C42B3D] border border-[#C42B3D] text-white font-bold hover:bg-[#A82433] hover:border-[#A82433] active:scale-95"
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
              ))}
            </div>
          )}
        </div>

        {/* Mobile Menu Modal */}
        {showMenuModal && (
          <div
            className="mobile-menu-overlay bg-black/50 z-[100]"
            onClick={() => setShowMenuModal(false)}
          >
            <div
              className="bg-white rounded-t-2xl w-full mobile-menu-drawer"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-black">Menu</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowMenuModal(false)}
                  className="mobile-menu-close-btn text-black h-12 w-12"
                >
                  <X className="w-8 h-8" />
                  <span className="sr-only">Close menu</span>
                </Button>
              </div>
              <div className="space-y-4">
                <Button
                  variant="ghost"
                  className="mobile-menu-btn w-full"
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
                  className="mobile-menu-btn w-full"
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
                  className="mobile-menu-btn w-full"
                  onClick={() => {
                    setView("taste-profile")
                    setShowMenuModal(false)
                  }}
                >
                  <Sparkles className="mr-3 h-5 w-5" />
                  Taste Profile
                </Button>
                <Button
                  variant="ghost"
                  className="mobile-menu-btn w-full"
                  onClick={() => {
                    setView("featured")
                    setShowMenuModal(false)
                  }}
                >
                  <BadgeAlert className="mr-3 h-5 w-5" />
                  Featured
                </Button>
                <Button
                  variant="ghost"
                  className="mobile-menu-btn w-full"
                  onClick={() => {
                    setView("why-kaleidorium")
                    setShowMenuModal(false)
                  }}
                >
                  <Info className="mr-3 h-5 w-5" />
                  How it works?
                </Button>
                <Button
                  variant="ghost"
                  className="mobile-menu-btn w-full"
                  onClick={() => {
                    setShowMenuModal(false)
                    router.push("/?view=why-kaleidorium&role=artist")
                  }}
                >
                  <Palette className="mr-3 h-5 w-5" />
                  For Artists
                </Button>
                <Button
                  variant="ghost"
                  className="mobile-menu-btn w-full"
                  onClick={() => {
                    setShowMenuModal(false)
                    router.push("/?view=why-kaleidorium&role=gallery")
                  }}
                >
                  <Building2 className="mr-3 h-5 w-5" />
                  For Galleries
                </Button>
                <Button
                  variant="ghost"
                  className="mobile-menu-btn w-full"
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
                  className="mobile-menu-btn w-full"
                  onClick={() => {
                    setView("profile")
                    setShowMenuModal(false)
                  }}
                >
                  <User className="mr-3 h-5 w-5" />
                  Account
                </Button>
                {/* Footer Links */}
                <div className="border-t border-gray-200 mt-4 pt-4">
                  <div className="space-y-2">
                    <button
                      className="mobile-menu-footer-link"
                      onClick={() => {
                        setView("terms");
                        setShowMenuModal(false);
                      }}
                    >
                      Terms of Service
                    </button>
                    <button
                      className="mobile-menu-footer-link"
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
            className="fixed inset-0 bg-black/50 z-[100]"
            onClick={() => {
              setShowInfoModal(false)
              setSelectedArtwork(null)
            }}
          >
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl w-full overflow-y-auto overscroll-contain shadow-xl"
            style={{ 
              height: '70%',
              maxHeight: '70%',
              WebkitOverflowScrolling: 'touch' 
            }}
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
                    className="text-black hover:bg-gray-100 h-12 w-12"
                  >
                    <X className="w-8 h-8" />
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
                        <span className="discover-section-title">Style &amp; Subject</span>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {allTags.map((tag) => (
                            <span key={tag} className="artwork-chip">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )
                  })()}
                </div>
                
                {/* Artist Website Button - Always show if link exists */}
                {selectedArtwork.link && selectedArtwork.link.trim() !== '' && (
                  <div className="pt-4">
                    <button
                      type="button"
                      className="artwork-cta-btn"
                      onClick={() => {
                        const linkUrl = selectedArtwork.link!;
                        // Validate and fix URL before opening
                        try {
                          let url = linkUrl.trim()
                          // Add https:// if no protocol is specified
                          if (!url.startsWith('http://') && !url.startsWith('https://')) {
                            url = 'https://' + url
                          }
                          // Validate the URL
                          new URL(url)
                          // On mobile, use location.href to avoid the K logo screen
                          window.location.href = url
                        } catch (error) {
                          console.error('Invalid artist URL:', linkUrl)
                          // Could show a toast message here if needed
                        }
                      }}
                    >
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h6"/><path d="M15 3h6v6"/><path d="M10 14L21 3"/></svg>
                      View on artist's website
                    </button>
                  </div>
                )}
                
                {/* Social Media Share Buttons */}
                <div className="pt-4">
                  <div className="share-panel text-center">
                    <p className="share-panel-title">Share this artwork</p>
                    <div className="flex justify-center gap-2">
                      <button 
                        className="share-icon-btn !w-10 !h-10 !rounded-lg"
                        onClick={() => {
                          const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://kaleidorium.com'
                          const shareUrl = `${baseUrl}/?artworkId=${selectedArtwork.id}`
                          const text = `Check out "${selectedArtwork.title}" by ${selectedArtwork.artist} on Kaleidorium`
                          window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`, '_blank', 'noopener,noreferrer');
                        }}
                        title="Share on X"
                      >
                        <XIcon className="w-5 h-5" />
                      </button>
                      <button 
                        className="share-icon-btn !w-10 !h-10 !rounded-lg"
                        onClick={() => {
                          const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://kaleidorium.com'
                          const shareUrl = `${baseUrl}/?artworkId=${selectedArtwork.id}`
                          const text = `Check out "${selectedArtwork.title}" by ${selectedArtwork.artist} on Kaleidorium`
                          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
                        }}
                        title="Share on Facebook"
                      >
                        <Facebook className="w-5 h-5" />
                      </button>
                      <button 
                        className="share-icon-btn !w-10 !h-10 !rounded-lg"
                        onClick={async () => {
                          const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://kaleidorium.com'
                          const shareUrl = `${baseUrl}/?artworkId=${selectedArtwork.id}`
                          const text = `Check out "${selectedArtwork.title}" by ${selectedArtwork.artist} on Kaleidorium\n\n${shareUrl}`
                          try {
                            await navigator.clipboard.writeText(text)
                            alert('Link copied! Paste it in your Instagram story or post.')
                          } catch (err) {
                            console.error('Failed to copy:', err)
                          }
                        }}
                        title="Share on Instagram (Copy Link)"
                      >
                        <Instagram className="w-5 h-5" />
                      </button>
                      <button 
                        className="share-icon-btn !w-10 !h-10 !rounded-lg"
                        onClick={() => {
                          const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://kaleidorium.com'
                          const shareUrl = `${baseUrl}/?artworkId=${selectedArtwork.id}`
                          const text = `Check out "${selectedArtwork.title}" by ${selectedArtwork.artist} on Kaleidorium`
                          const whatsappText = `${text}\n\n${shareUrl}`
                          window.open(`https://wa.me/?text=${encodeURIComponent(whatsappText)}`, '_blank', 'noopener,noreferrer');
                        }}
                        title="Share on WhatsApp"
                      >
                        <MessageCircle className="w-5 h-5" />
                      </button>
                      <button 
                        className="share-icon-btn !w-10 !h-10 !rounded-lg"
                        onClick={async () => {
                          const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://kaleidorium.com'
                          const shareUrl = `${baseUrl}/?artworkId=${selectedArtwork.id}`
                          try {
                            await navigator.clipboard.writeText(shareUrl)
                            alert('Link copied to clipboard!')
                          } catch (err) {
                            console.error('Failed to copy:', err)
                            // Fallback for older browsers
                            const textArea = document.createElement('textarea')
                            textArea.value = shareUrl
                            document.body.appendChild(textArea)
                            textArea.select()
                            document.execCommand('copy')
                            document.body.removeChild(textArea)
                            alert('Link copied to clipboard!')
                          }
                        }}
                        title="Copy Link"
                      >
                        <Copy className="w-5 h-5" />
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

  const mobileDiscoverHeader = (
    <div className="flex justify-between items-center p-4 bg-white border-b border-[#E6E4DF] z-10 shrink-0">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setShowMenuModal(true)}
        className="text-black hover:bg-gray-100"
      >
        <Menu className="w-6 h-6" />
      </Button>
      <div className="flex items-center justify-center flex-1">
        <KaleidoriumWordmark size="mobile" />
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setView("profile")}
        className="text-black hover:bg-gray-100"
      >
        <User className="w-6 h-6" />
      </Button>
    </div>
  )

  // Discovery View - CardStack
  if (visibleArtworks.length === 0) {
    return (
      <div className={getContainerClasses()}>
        {gestureIntroOverlay}
        {mobileDiscoverHeader}
        {view === "discover" && discoverSearchBar}
        <div className={getMainAreaClasses()}>
          <div className="h-full overflow-y-auto p-4 flex items-center justify-center">
            <p className="text-[#5F5F5A] text-base text-center">
              {fallbackMessage || "No more artworks to discover!"}
            </p>
          </div>
        </div>
        {buttonOnboardingOverlay}
      </div>
    )
  }

  return (
    <div className={getContainerClasses()}>
      {gestureIntroOverlay}
      {mobileDiscoverHeader}
      {view === "discover" && discoverSearchBar}
      <div className={getMainAreaClasses()}>
        <div
          ref={containerRef}
          className="h-full overflow-y-auto p-4 space-y-5 discover-feed-bg"
        >
          {/* Kurator Banner — above the feed */}
          {view === "discover" && localPreferences && (
            <KuratorBanner localPreferences={localPreferences} isRegistered={isRegistered} newArtworkCount={newArtworkCount} />
          )}

          {visibleArtworks.map((artwork, index) => (
            <div
              key={artwork.id}
              ref={(el) => {
                cardRefs.current[artwork.id] = el
              }}
              className="discover-mobile-card"
              onTouchStart={(e) => handleTouchStart(e, artwork.id)}
              onTouchMove={(e) => handleTouchMove(e, artwork.id)}
              onTouchEnd={() => handleTouchEnd(artwork.id, artwork)}
              style={{ willChange: 'transform' }}
            >
              {/* Artwork Image */}
              <div 
                className="discover-mobile-artwork-frame"
                onClick={() => handleArtworkTap(artwork)}
              >
                <Image
                  src={artwork.artwork_image}
                  alt={artwork.title}
                  fill
                  className="object-contain p-3 transition-opacity duration-300"
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
              <div className="discover-mobile-card-body">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h2 className="discover-mobile-title">{artwork.title}</h2>
                    <ArtistNameWithBadge 
                      artistName={artwork.artist}
                      artistId={(artwork as any).artist_id}
                      className="discover-mobile-artist"
                    />
                  </div>
                </div>

                {/* Kurator Insight */}
                {localPreferences && (
                  <>
                    <KuratorInsight artwork={artwork} localPreferences={localPreferences} lastVisitDate={lastVisitDate} />
                    <KuratorEarlyEncouragement interactionCount={localPreferences.interactionCount} />
                  </>
                )}

                {/* Action Buttons */}
                <div className="discover-mobile-actions relative">
                  <div className="discover-mobile-action">
                    <button
                      type="button"
                      id="dislike-button"
                      className={`discover-mobile-action-btn discover-mobile-action-btn--dislike
                        ${buttonStates.dislike ? 'scale-95 brightness-90' : ''}
                        ${currentOnboardingStep === 'dislike' ? 'ring-2 ring-[#D64545] ring-offset-2 z-10' : ''}`}
                      onClick={() => {
                        handleButtonAction('dislike', artwork)
                        if (currentOnboardingStep === 'dislike') nextOnboardingStep()
                      }}
                      disabled={isAnimating}
                      aria-label="Not for me"
                    >
                      <svg className="discover-action-glyph" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                        <path d="M7 7l10 10M17 7L7 17" />
                      </svg>
                    </button>
                    <span className="discover-mobile-action-label">Not for me</span>
                  </div>

                  <div className="discover-mobile-action">
                    <button
                      type="button"
                      id="info-button"
                      className={`discover-mobile-action-btn discover-mobile-action-btn--info
                        ${buttonStates.info ? 'scale-95 brightness-90' : ''}
                        ${currentOnboardingStep === 'info' ? 'ring-2 ring-[#1E1E1C] ring-offset-2 z-10' : ''}`}
                      onClick={() => {
                        handleButtonAction('info', artwork)
                        if (currentOnboardingStep === 'info') nextOnboardingStep()
                      }}
                      disabled={isAnimating}
                      aria-label="Info"
                    >
                      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="12" cy="12" r="9" />
                        <line x1="12" y1="10" x2="12" y2="16" />
                        <circle cx="12" cy="7.25" r="0.75" fill="currentColor" stroke="none" />
                      </svg>
                    </button>
                    <span className="discover-mobile-action-label">Info</span>
                  </div>

                  <div className="discover-mobile-action">
                    <button
                      type="button"
                      id="like-button"
                      className={`discover-mobile-action-btn discover-mobile-action-btn--like
                        ${buttonStates.like ? 'scale-95 brightness-90' : ''}
                        ${currentOnboardingStep === 'like' ? 'ring-2 ring-[#3D9B6A] ring-offset-2 z-10' : ''}`}
                      onClick={() => {
                        handleButtonAction('like', artwork)
                        if (currentOnboardingStep === 'like') nextOnboardingStep()
                      }}
                      disabled={isAnimating}
                      aria-label="Show me more"
                    >
                      <svg className="discover-action-glyph" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M12 20.5s-6.5-4.2-6.5-9.1C5.5 8.1 7.6 6 10.2 6c1.5 0 2.9.7 3.8 1.8.9-1.1 2.3-1.8 3.8-1.8 2.6 0 4.7 2.1 4.7 5.4 0 4.9-6.5 9.1-6.5 9.1z" />
                      </svg>
                    </button>
                    <span className="discover-mobile-action-label">Show me more</span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {visibleCardCount < artworks.length && (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-2 border-[#E6E4DF] border-t-[#1E1E1C] rounded-full animate-spin"></div>
            </div>
          )}
          
          {/* Fallback message when no filters match */}
          {showFallbackMessage && (
            <div className="mt-8 text-center p-6 bg-[#FAFAF8] border border-[#E6E4DF] rounded-lg mx-4">
              <p className="text-sm text-[#5F5F5A]">
                {fallbackMessage ||
                  "No artwork found. Try a different search or remove some filters."}
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Button Onboarding Overlay for Discover View */}
      {buttonOnboardingOverlay}
      
      {/* Button Onboarding Overlay */}
      {buttonOnboardingOverlay}

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
                          filters.style.includes(tag) ? 'bg-[#F0EBFF] border-[#D9CFF7]' : ''
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
                          filters.subject.includes(tag) ? 'bg-[#F0EBFF] border-[#D9CFF7]' : ''
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
                          filters.colors.includes(tag) ? 'bg-[#F0EBFF] border-[#D9CFF7]' : ''
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
                  className="flex-1 bg-white border border-[#000000] text-[#000000] font-bold hover:bg-[#8B6AD4] hover:border-[#8B6AD4] hover:text-white hover:scale-[1.02] active:scale-95 transition-all"
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
        <div className="mobile-menu-overlay bg-black/50 z-[100]">
          <div className="bg-white rounded-t-2xl w-full mobile-menu-drawer">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-black">Menu</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMenuModal(false)}
                className="mobile-menu-close-btn text-black"
              >
                ×
              </Button>
            </div>
            <div className="space-y-4">
              <Button
                variant="ghost"
                className="mobile-menu-btn w-full"
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
                className="mobile-menu-btn w-full"
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
                className="mobile-menu-btn w-full"
                onClick={() => {
                  setView("taste-profile")
                  setShowMenuModal(false)
                }}
              >
                <Sparkles className="mr-3 h-5 w-5" />
                Taste Profile
              </Button>
              <Button
                variant="ghost"
                className="mobile-menu-btn w-full"
                onClick={() => {
                  setView("featured")
                  setShowMenuModal(false)
                }}
              >
                <BadgeAlert className="mr-3 h-5 w-5" />
                Featured
              </Button>
              <Button
                variant="ghost"
                className="mobile-menu-btn w-full"
                onClick={() => {
                  setView("why-kaleidorium")
                  setShowMenuModal(false)
                }}
              >
                <Info className="mr-3 h-5 w-5" />
                How it works?
              </Button>
              <Button
                variant="ghost"
                className="mobile-menu-btn w-full"
                onClick={() => {
                  setShowMenuModal(false)
                  router.push("/?view=why-kaleidorium&role=artist")
                }}
              >
                <Palette className="mr-3 h-5 w-5" />
                For Artists
              </Button>
              <Button
                variant="ghost"
                className="mobile-menu-btn w-full"
                onClick={() => {
                  setShowMenuModal(false)
                  router.push("/?view=why-kaleidorium&role=gallery")
                }}
              >
                <Building2 className="mr-3 h-5 w-5" />
                For Galleries
              </Button>
              <Button
                variant="ghost"
                className="mobile-menu-btn w-full"
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
                className="mobile-menu-btn w-full"
                onClick={() => {
                  setView("profile")
                  setShowMenuModal(false)
                }}
              >
                <User className="mr-3 h-5 w-5" />
                Account
              </Button>
              {/* Footer Links */}
              <div className="border-t border-gray-200 mt-4 pt-4">
                <div className="space-y-2">
                  <button
                    className="mobile-menu-footer-link"
                    onClick={() => {
                      setView("terms");
                      setShowMenuModal(false);
                    }}
                  >
                    Terms of Service
                  </button>
                  <button
                    className="mobile-menu-footer-link"
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
                
                {selectedArtwork.price && (
                  <div>
                    <span className="font-semibold text-black">Price:</span>
                    <span className="ml-2 text-gray-700">
                      {selectedArtwork.price.toLowerCase() === 'sold' || 
                       selectedArtwork.price.toLowerCase() === 'enquire' || 
                       selectedArtwork.price.toLowerCase() === 'not for sale'
                        ? selectedArtwork.price
                        : selectedArtwork.currency
                          ? `${selectedArtwork.price} ${selectedArtwork.currency}`
                          : selectedArtwork.price
                      }
                    </span>
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
                      <span className="discover-section-title">Style &amp; Subject</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {allTags.map((tag) => (
                          <span key={tag} className="artwork-chip">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )
                })()}
                
                {/* Artist Website Button - Only show if link exists */}
                {selectedArtwork.link && selectedArtwork.link.trim() !== '' && (
                  <div className="pt-4">
                    <button
                      type="button"
                      className="artwork-cta-btn"
                      onClick={() => {
                        // Validate and fix URL before opening
                        try {
                          let url = selectedArtwork.link!.trim()
                          // Add https:// if no protocol is specified
                          if (!url.startsWith('http://') && !url.startsWith('https://')) {
                            url = 'https://' + url
                          }
                          // Validate the URL
                          new URL(url)
                          // On mobile, use location.href to avoid the K logo screen
                          window.location.href = url
                        } catch (error) {
                          console.error('Invalid artist URL:', selectedArtwork.link)
                          // Could show a toast message here if needed
                        }
                      }}
                    >
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h6"/><path d="M15 3h6v6"/><path d="M10 14L21 3"/></svg>
                      View on artist's website
                    </button>
                  </div>
                )}
                
                {/* Social Media Share Buttons */}
                <div className="pt-4">
                  <div className="share-panel text-center">
                    <p className="share-panel-title">Share this artwork</p>
                    <div className="flex justify-center gap-2">
                      <button 
                        className="share-icon-btn !w-10 !h-10 !rounded-lg"
                        onClick={() => {
                          const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://kaleidorium.com'
                          const shareUrl = `${baseUrl}/?artworkId=${selectedArtwork.id}`
                          const text = `Check out "${selectedArtwork.title}" by ${selectedArtwork.artist} on Kaleidorium`
                          window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`, '_blank', 'noopener,noreferrer');
                        }}
                        title="Share on X"
                      >
                        <XIcon className="w-5 h-5" />
                      </button>
                      <button 
                        className="share-icon-btn !w-10 !h-10 !rounded-lg"
                        onClick={() => {
                          const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://kaleidorium.com'
                          const shareUrl = `${baseUrl}/?artworkId=${selectedArtwork.id}`
                          const text = `Check out "${selectedArtwork.title}" by ${selectedArtwork.artist} on Kaleidorium`
                          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
                        }}
                        title="Share on Facebook"
                      >
                        <Facebook className="w-5 h-5" />
                      </button>
                      <button 
                        className="share-icon-btn !w-10 !h-10 !rounded-lg"
                        onClick={async () => {
                          const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://kaleidorium.com'
                          const shareUrl = `${baseUrl}/?artworkId=${selectedArtwork.id}`
                          const text = `Check out "${selectedArtwork.title}" by ${selectedArtwork.artist} on Kaleidorium\n\n${shareUrl}`
                          try {
                            await navigator.clipboard.writeText(text)
                            alert('Link copied! Paste it in your Instagram story or post.')
                          } catch (err) {
                            console.error('Failed to copy:', err)
                          }
                        }}
                        title="Share on Instagram (Copy Link)"
                      >
                        <Instagram className="w-5 h-5" />
                      </button>
                      <button 
                        className="share-icon-btn !w-10 !h-10 !rounded-lg"
                        onClick={() => {
                          const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://kaleidorium.com'
                          const shareUrl = `${baseUrl}/?artworkId=${selectedArtwork.id}`
                          const text = `Check out "${selectedArtwork.title}" by ${selectedArtwork.artist} on Kaleidorium`
                          const whatsappText = `${text}\n\n${shareUrl}`
                          window.open(`https://wa.me/?text=${encodeURIComponent(whatsappText)}`, '_blank', 'noopener,noreferrer');
                        }}
                        title="Share on WhatsApp"
                      >
                        <MessageCircle className="w-5 h-5" />
                      </button>
                      <button 
                        className="share-icon-btn !w-10 !h-10 !rounded-lg"
                        onClick={async () => {
                          const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://kaleidorium.com'
                          const shareUrl = `${baseUrl}/?artworkId=${selectedArtwork.id}`
                          try {
                            await navigator.clipboard.writeText(shareUrl)
                            alert('Link copied to clipboard!')
                          } catch (err) {
                            console.error('Failed to copy:', err)
                            // Fallback for older browsers
                            const textArea = document.createElement('textarea')
                            textArea.value = shareUrl
                            document.body.appendChild(textArea)
                            textArea.select()
                            document.execCommand('copy')
                            document.body.removeChild(textArea)
                            alert('Link copied to clipboard!')
                          }
                        }}
                        title="Copy Link"
                      >
                        <Copy className="w-5 h-5" />
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
