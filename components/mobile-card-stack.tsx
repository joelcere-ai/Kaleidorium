"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { Heart, ThumbsUp, ThumbsDown, Info, Menu, Search, Palette, Mail, User } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import type { Artwork } from "@/types/artwork"

interface MobileCardStackProps {
  artworks: Artwork[]
  onLike: (artwork: Artwork) => void
  onDislike: (artwork: Artwork) => void
  onAddToCollection: (artwork: Artwork) => void
  onLoadMore: () => void
  setView: (view: "discover" | "collection" | "profile" | "for-artists" | "about" | "contact") => void
  view: "discover" | "collection"
  collection: Artwork[]
  onRemoveFromCollection: (id: string) => void
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
  isLandscape = false,
  isPortrait = true,
  screenWidth = 0,
  screenHeight = 0,
}: MobileCardStackProps) {
  const { toast } = useToast()
  const [visibleCardCount, setVisibleCardCount] = useState(3)
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [showMenuModal, setShowMenuModal] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null)
  const [showFullscreenArtwork, setShowFullscreenArtwork] = useState(false)
  const [fullscreenImageLoaded, setFullscreenImageLoaded] = useState(false)
  const [currentCollectionIndex, setCurrentCollectionIndex] = useState(0)
  
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
      } else {
        // Swipe left - Dislike
        onDislike(artwork)
      }
      
      // Animate card out quickly
      const cardRef = cardRefs.current[artworkId]
      if (cardRef) {
        const finalX = currentX.current > 0 ? (screenWidth || window.innerWidth) : -(screenWidth || window.innerWidth)
        cardRef.style.transition = 'transform 0.2s ease-out, opacity 0.2s ease-out'
        cardRef.style.transform = `translateX(${finalX}px) rotate(${currentX.current * 0.2}deg)`
        cardRef.style.opacity = '0'
      }
      
      // Reset quickly
      setTimeout(() => {
        resetCard(artworkId)
        setIsAnimating(false)
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
        // Remove toast for better performance
        break
      case 'dislike':
        onDislike(artwork)
        // Remove toast for better performance
        break
      case 'add':
        onAddToCollection(artwork)
        toast({
          title: "Added to Collection! ❤️",
          description: `"${artwork.title}" has been added to your collection`,
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
          <h1 className="text-xl font-bold text-black">Kaleidorium</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowMenuModal(true)}
            className="text-black hover:bg-gray-100"
          >
            <Menu className="w-6 h-6" />
          </Button>
        </div>

        {/* Collection Content */}
        <div className="flex-1 overflow-y-auto p-4" ref={containerRef}>
          {collection.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Heart className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-xl font-medium mb-2 text-black">Your collection is empty</h3>
              <p className="text-gray-600 mb-6">Start discovering art and add pieces you love!</p>
              <Button onClick={() => setView("discover")}>Start Discovering</Button>
            </div>
          ) : (
            <div className={`space-y-4 ${isLandscape ? 'grid grid-cols-2 gap-4 space-y-0' : ''}`}>
              {collection.map((artwork) => (
                <div key={artwork.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm cursor-pointer hover:shadow-md transition-shadow duration-200">
                  <div className={`flex ${isLandscape ? 'flex-col' : ''}`} onClick={() => handleArtworkTap(artwork)}>
                    {/* Artwork Image */}
                    <div className={`${isLandscape ? 'w-full aspect-square' : 'w-24 h-24'} flex-shrink-0 relative`}>
                      <img
                        src={artwork.artwork_image || "/placeholder.svg"}
                        alt={artwork.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    {/* Artwork Info */}
                    <div className={`flex-1 p-4 flex flex-col justify-between ${isLandscape ? 'min-h-[120px]' : ''}`}>
                      <div>
                        <h3 className="font-semibold text-black text-lg leading-tight">{artwork.title}</h3>
                        <p className="text-gray-600 text-sm">{artwork.artist}</p>
                        <p className="text-black font-medium text-base mt-1">{artwork.price}</p>
                      </div>
                    </div>
                    
                    {/* Info Button */}
                    <div className={`p-4 flex items-center ${isLandscape ? 'justify-center' : ''}`}>
                      <Button
                        variant="outline"
                        size="icon"
                        className="w-12 h-12 rounded-full border-gray-300 hover:bg-gray-50"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedArtwork(artwork)
                          setShowInfoModal(true)
                        }}
                      >
                        <Info className="w-6 h-6 text-black" />
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
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
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
                    setView("about")
                    setShowMenuModal(false)
                  }}
                >
                  <Info className="mr-3 h-5 w-5" />
                  About
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-black hover:bg-gray-100"
                  onClick={() => {
                    setView("contact")
                    setShowMenuModal(false)
                  }}
                >
                  <Mail className="mr-3 h-5 w-5" />
                  Contact
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-black hover:bg-gray-100"
                  onClick={() => {
                    setView("profile")
                    setShowMenuModal(false)
                  }}
                >
                  <User className="mr-3 h-5 w-5" />
                  Profile
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Artwork Info Modal */}
        {showInfoModal && selectedArtwork && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-lg w-full max-h-[90vh] overflow-y-auto max-w-md">
              <div className="p-6">
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
                      <span className="ml-2 text-gray-700">{selectedArtwork.dimensions}</span>
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
        <h1 className="text-xl font-bold text-black">Kaleidorium</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowMenuModal(true)}
          className="text-black hover:bg-gray-100"
        >
          <Menu className="w-6 h-6" />
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
                className="relative w-full aspect-[4/3] cursor-pointer"
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

                {/* Swipe Overlays */}
                {swipeDirection === 'right' && (
                  <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                    <div className="bg-green-500 rounded-full p-4">
                      <ThumbsUp className="w-8 h-8 text-white fill-white" />
                    </div>
                  </div>
                )}
                
                {swipeDirection === 'left' && (
                  <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                    <div className="bg-red-500 rounded-full p-4">
                      <ThumbsDown className="w-8 h-8 text-white fill-white" />
                    </div>
                  </div>
                )}
              </div>

              {/* Simplified Artwork Information */}
              <div className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h2 className="text-lg font-bold text-black mb-1">{artwork.title}</h2>
                    <p className="text-sm text-gray-600">{artwork.artist}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-center gap-6">
                  <Button
                    variant="outline"
                    size="icon"
                    className={`w-16 h-16 rounded-full border-red-300 hover:bg-red-50 hover:border-red-400 
                      transition-all duration-200 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg
                      ${buttonStates.dislike ? 'scale-95 bg-red-50' : ''}`}
                    onClick={() => handleButtonAction('dislike', artwork)}
                    disabled={isAnimating}
                  >
                    <ThumbsDown className="w-7 h-7 text-red-600" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    className={`w-16 h-16 rounded-full border-blue-300 hover:bg-blue-50 hover:border-blue-400 
                      transition-all duration-200 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg
                      ${buttonStates.info ? 'scale-95 bg-blue-50' : ''}`}
                    onClick={() => handleButtonAction('info', artwork)}
                    disabled={isAnimating}
                  >
                    <Info className="w-7 h-7 text-blue-600" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    className={`w-16 h-16 rounded-full border-pink-300 hover:bg-pink-50 hover:border-pink-400 
                      transition-all duration-200 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg
                      ${buttonStates.add ? 'scale-95 bg-pink-50 animate-pulse' : ''}`}
                    onClick={() => handleButtonAction('add', artwork)}
                    disabled={isAnimating}
                  >
                    <Heart className="w-7 h-7 text-pink-600" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    className={`w-16 h-16 rounded-full border-green-300 hover:bg-green-50 hover:border-green-400 
                      transition-all duration-200 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg
                      ${buttonStates.like ? 'scale-95 bg-green-50' : ''}`}
                    onClick={() => handleButtonAction('like', artwork)}
                    disabled={isAnimating}
                  >
                    <ThumbsUp className="w-7 h-7 text-green-600" />
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
                <div>
                  <label className="block text-sm font-medium mb-2">Style</label>
                  <input
                    type="text"
                    placeholder="e.g. Abstract, Portrait, Digital Art..."
                    className="w-full p-3 border border-gray-300 rounded-md mb-2"
                  />
                  <div className="flex flex-wrap gap-2">
                    {['Abstract', 'Portrait', 'Digital Art', 'Contemporary', 'Modern'].map((tag) => (
                      <Badge key={tag} variant="outline" className="cursor-pointer hover:bg-gray-200 text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Subject Filter */}
                <div>
                  <label className="block text-sm font-medium mb-2">Subject</label>
                  <input
                    type="text"
                    placeholder="e.g. Nature, Urban, Portrait..."
                    className="w-full p-3 border border-gray-300 rounded-md mb-2"
                  />
                  <div className="flex flex-wrap gap-2">
                    {['Nature', 'Urban', 'Portrait', 'Abstract', 'Landscape'].map((tag) => (
                      <Badge key={tag} variant="outline" className="cursor-pointer hover:bg-gray-200 text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Colors Filter */}
                <div>
                  <label className="block text-sm font-medium mb-2">Colors</label>
                  <input
                    type="text"
                    placeholder="e.g. Black, Colorful, Warm tones..."
                    className="w-full p-3 border border-gray-300 rounded-md mb-2"
                  />
                  <div className="flex flex-wrap gap-2">
                    {['Black', 'Colorful', 'Warm', 'Cool', 'Monochrome'].map((tag) => (
                      <Badge key={tag} variant="outline" className="cursor-pointer hover:bg-gray-200 text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Filter Action Buttons */}
              <div className="flex gap-4 mt-8">
                <Button className="flex-1 bg-black text-white hover:bg-gray-800">
                  Apply Filters
                </Button>
                <Button variant="outline" className="flex-1">
                  Clear Filters
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Menu Modal */}
      {showMenuModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
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
                  setView("about")
                  setShowMenuModal(false)
                }}
              >
                <Info className="mr-3 h-5 w-5" />
                About
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-black hover:bg-gray-100"
                onClick={() => {
                  setView("contact")
                  setShowMenuModal(false)
                }}
              >
                <Mail className="mr-3 h-5 w-5" />
                Contact
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-black hover:bg-gray-100"
                onClick={() => {
                  setView("profile")
                  setShowMenuModal(false)
                }}
              >
                <User className="mr-3 h-5 w-5" />
                Profile
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Artwork Info Modal */}
      {showInfoModal && selectedArtwork && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-lg w-full max-h-[90vh] overflow-y-auto max-w-md">
            <div className="p-6">
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
                
                {/* Sale Status Button */}
                <div className="pt-4">
                  <Button 
                    className="w-full bg-black text-white hover:bg-gray-800"
                    onClick={() => {
                      if (selectedArtwork.link) {
                        window.open(selectedArtwork.link, '_blank')
                      }
                    }}
                  >
                    {selectedArtwork.price === 'Not for sale' ? 'Not for sale' : selectedArtwork.price}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full-Screen Artwork Overlay */}
      {showFullscreenArtwork && selectedArtwork && (
        <div className="fixed inset-0 bg-black z-[200] flex items-center justify-center">
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
