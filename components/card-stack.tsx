"use client"

import React, { useState, useEffect, useRef } from 'react'
import { Heart, ThumbsUp, ThumbsDown, Facebook, Instagram, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ArtistNameWithBadge } from "@/components/artist-name-with-badge"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import type { Artwork } from "@/types/artwork"
import ProgressiveImage from "./progressive-image"

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

interface CardStackProps {
  artworks: Artwork[]
  currentIndex: number
  onLike: (artwork: Artwork) => void
  onDislike: (artwork: Artwork) => void
  onAddToCollection: (artwork: Artwork) => void
  onNext: () => void
  onLoadMore: () => void
  onImageClick: (url: string, alt: string) => void
  loading: boolean
  showFallbackMessage?: boolean
}


export default function CardStack({
  artworks,
  currentIndex,
  onLike,
  onDislike,
  onAddToCollection,
  onNext,
  onLoadMore,
  onImageClick,
  loading,
  showFallbackMessage = false
}: CardStackProps) {
  const { toast } = useToast()
  const [visibleCardCount, setVisibleCardCount] = useState(3) // Start with 3 cards

  // Get visible cards based on current count
  const getVisibleCards = () => {
    const cards = []
    for (let i = 0; i < visibleCardCount; i++) {
      const index = currentIndex + i
      if (index < artworks.length) {
        cards.push({
          artwork: artworks[index],
          index,
          zIndex: 3 - i,
          isTop: i === 0
        })
      }
    }
    return cards
  }

  const visibleCards = getVisibleCards()

  // Prefetch more artworks when running low
  useEffect(() => {
    const remainingCards = artworks.length - currentIndex
    if (remainingCards <= 3) {
      onLoadMore()
    }
  }, [currentIndex, artworks.length, onLoadMore])

  // Scroll-based card loading
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight
      
      // Show 3 more cards when user is 80% down the page
      if (scrollTop + windowHeight >= documentHeight * 0.8) {
        const remainingCards = artworks.length - currentIndex - visibleCardCount
        if (remainingCards > 0) {
          setVisibleCardCount(prev => prev + 3) // Add 3 more cards
        } else if (remainingCards <= 0 && !loading) {
          // Load more artworks from API when we're running low
          onLoadMore()
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [artworks.length, currentIndex, visibleCardCount, loading, onLoadMore])

  // Reset visible card count when filters change or artworks change
  useEffect(() => {
    setVisibleCardCount(3)
  }, [artworks.length, currentIndex])

  const handleAction = (action: 'like' | 'dislike' | 'add', artwork: Artwork) => {
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
    }
    // Don't call onNext() - keep current card visible, only upcoming cards will refresh
  }


  if (!visibleCards.length) {
    return (
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="w-full flex flex-col p-4 sm:p-6 lg:p-8 bg-white relative">
          <div className="flex items-center justify-center p-8">
            {showFallbackMessage ? (
              <div className="text-center p-6 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">No more artwork matching your criteria</h3>
                <p className="text-sm text-blue-600">
                  Remove some of the filters you selected or come back soon as we are always adding new artwork.
                </p>
              </div>
            ) : (
              <div className="text-center">
                <h2 className="text-xl font-semibold mb-4">No artworks available</h2>
                <p className="text-muted-foreground">Check back later for more artworks</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Main CardStack Area */}
      <div className="w-full flex flex-col p-4 sm:p-6 lg:p-8 bg-white relative">
        

        {/* Cards Stack - Vertical Layout */}
        <div className="flex-1 max-w-7xl mx-auto w-full space-y-8">
          {visibleCards.map(({ artwork, index }, cardIndex) => (
            <div
              key={artwork.id}
              className="transition-all duration-300 ease-out"
            >
              <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                <div className="flex flex-col lg:flex-row">
                  {/* Artwork Image Section */}
                  <div className="w-full lg:w-[70%] flex-shrink-0">
                    <div
                      className="relative h-[400px] lg:h-[500px] cursor-zoom-in bg-gray-50"
                      onClick={() => onImageClick(artwork.artwork_image, artwork.title)}
                    >
                      <ProgressiveImage
                        src={artwork.artwork_image || "/placeholder.svg"}
                        alt={artwork.title}
                        className="w-full h-full p-6"
                        style={{ objectFit: 'contain' }}
                        priority={cardIndex === 0}
                      />
                    </div>
                    
                    {/* Card Info Section */}
                    <div className="p-6 border-t border-gray-100">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                        <div className="mb-4 sm:mb-0">
                          <h3 className="text-base font-serif font-bold text-black mb-2" style={{fontSize: '16px', fontFamily: 'Times New Roman, serif'}}>
                            {artwork.title}
                          </h3>
                          <div className="text-base font-serif text-gray-600 mb-2" style={{fontSize: '16px', fontFamily: 'Times New Roman, serif'}}>
                            by <ArtistNameWithBadge 
                              artistName={artwork.artist}
                              artistId={(artwork as any).artist_id}
                              className="inline"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-center gap-4 sm:gap-8">
            <Button
              size="lg"
              onClick={() => handleAction('dislike', artwork)}
              className="flex-1 sm:flex-none min-w-[120px] border border-black bg-white text-black hover:bg-black hover:text-white hover:scale-105 transition-all duration-200"
            >
              <ThumbsDown className="w-5 h-5 mr-2" />
              <span className="sm:hidden">👎</span>
              <span className="hidden sm:inline">Dislike</span>
            </Button>
            
            <Button
              size="lg"
              onClick={() => handleAction('add', artwork)}
              className="flex-1 sm:flex-none min-w-[120px] px-4 sm:px-8 border border-black bg-white text-black hover:bg-black hover:text-white hover:scale-105 transition-all duration-200"
            >
              <Heart className="w-5 h-5 mr-2" />
              <span className="sm:hidden">❤️</span>
              <span className="hidden sm:inline">Add to Collection</span>
            </Button>
            
            <Button
              size="lg"
              onClick={() => handleAction('like', artwork)}
              className="flex-1 sm:flex-none min-w-[120px] border border-black bg-white text-black hover:bg-black hover:text-white hover:scale-105 transition-all duration-200"
            >
              <ThumbsUp className="w-5 h-5 mr-2" />
              <span className="sm:hidden">👍</span>
              <span className="hidden sm:inline">Like</span>
            </Button>
                      </div>
                    </div>
                  </div>

                  {/* Integrated Information Panel */}
                  <div className="w-full lg:w-[30%] border-t lg:border-t-0 lg:border-l bg-background">
                    <div className="p-6 space-y-6">
                      {/* Enhanced Description */}
                      <div className="space-y-3">
                        <h3 className="text-base font-serif font-bold text-black" style={{fontSize: '16px', fontFamily: 'Times New Roman, serif'}}>About this artwork</h3>
                        <p className="text-sm font-sans text-gray-600 leading-relaxed" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>{artwork.description}</p>
                      </div>

                      {/* Artwork Information */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-4 text-sm font-sans text-gray-600" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>
                          {artwork.year && <span>{artwork.year}</span>}
                          {artwork.medium && <span>{artwork.medium}</span>}
                          {artwork.dimensions && <span>{formatDimensions(artwork.dimensions)}</span>}
                        </div>
                      </div>

                      {/* Enhanced Tags */}
                      <div className="space-y-4">
                        <h3 className="text-base font-serif font-bold text-black" style={{fontSize: '16px', fontFamily: 'Times New Roman, serif'}}>Style & Subject</h3>
                        <div className="flex flex-wrap gap-3">
                          {[artwork.genre, artwork.style, artwork.subject, artwork.colour, ...(artwork.tags || [])]
                            .filter((tag, idx, arr) => tag && arr.indexOf(tag) === idx)
                            .length > 0 ? (
                            [artwork.genre, artwork.style, artwork.subject, artwork.colour, ...(artwork.tags || [])]
                              .filter((tag, idx, arr) => tag && arr.indexOf(tag) === idx)
                              .map((tag) => (
                                <Badge 
                                  key={tag} 
                                  variant="outline" 
                                  className="px-3 py-1 text-sm font-sans text-black border-gray-300 hover:bg-gray-50 transition-colors duration-200"
                                  style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}
                                >
                                  {tag}
                                </Badge>
                              ))
                          ) : (
                            <span className="text-muted-foreground text-sm italic">No tags available</span>
                          )}
                        </div>
                      </div>

                      {/* Enhanced Price Display / Sale Status */}
                      {artwork.price && (
                        <div className="py-4 px-6 bg-gray-50 rounded-xl border">
                          {artwork.price.toLowerCase() === 'not for sale'
                            ? <div className="text-center">
                                <Button
                                  size="lg"
                                  onClick={() => {
                                    if (artwork.link && artwork.link.trim() !== '') {
                                      // Validate and fix URL before opening
                                      try {
                                        let url = artwork.link.trim()
                                        // Add https:// if no protocol is specified
                                        if (!url.startsWith('http://') && !url.startsWith('https://')) {
                                          url = 'https://' + url
                                        }
                                        // Validate the URL
                                        new URL(url)
                                        window.open(url, '_blank', 'noopener,noreferrer');
                                      } catch (error) {
                                        console.error('Invalid artist URL:', artwork.link)
                                        // Could show a toast message here if needed
                                      }
                                    }
                                  }}
                                  className={`min-w-[120px] ${
                                    artwork.link && artwork.link.trim() !== ''
                                      ? 'border border-black bg-white text-black hover:bg-black hover:text-white' 
                                      : 'bg-gray-200 text-black hover:bg-gray-300'
                                  } transition-all duration-200`}
                                  style={{height: '40px', fontSize: '14px', fontFamily: 'Arial, sans-serif'}}
                                >
                                  {artwork.link && artwork.link.trim() !== '' ? 'View on artist\'s website' : 'Not for sale'}
                                </Button>
                              </div>
                            : <div className="text-center">
                                <span className="text-3xl font-bold text-foreground">{artwork.price}</span>
                              </div>
                          }
                        </div>
                      )}

                    {/* Social Media Share Buttons */}
                    <div className="py-4 px-6 bg-gray-50 rounded-xl border">
                      <div className="text-center">
                        <p className="text-sm font-sans text-gray-600 mb-3" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>Share this artwork</p>
                        <div className="flex justify-center gap-2">
                          <button 
                            className="w-10 h-10 border border-black bg-white rounded-full flex items-center justify-center hover:bg-black hover:text-white transition-all duration-200"
                            onClick={() => {
                              const url = encodeURIComponent(window.location.href);
                              const text = encodeURIComponent(`Check out "${artwork.title}" by ${artwork.artist} on Kaleidorium`);
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
                              const text = encodeURIComponent(`Check out "${artwork.title}" by ${artwork.artist} on Kaleidorium`);
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
                              const text = encodeURIComponent(`Check out "${artwork.title}" by ${artwork.artist} on Kaleidorium`);
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
                              const text = encodeURIComponent(`Check out "${artwork.title}" by ${artwork.artist} on Kaleidorium`);
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
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Loading indicator and end of cards message */}
        {loading && (
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-2 text-sm text-gray-500">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
              Loading more artworks...
            </div>
          </div>
        )}
        
        {!loading && visibleCardCount >= artworks.length - currentIndex && artworks.length > 0 && (
          <div className="mt-8 text-center p-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-600 mb-2">You've seen all the artworks!</h3>
            <p className="text-sm text-gray-500">Check back later for new additions to our collection</p>
          </div>
        )}
        
        {/* Fallback message when no filters match */}
        {showFallbackMessage && (
          <div className="mt-8 text-center p-6 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">No more artwork matching your criteria</h3>
            <p className="text-sm text-blue-600">
              Remove some of the filters you selected or come back soon as we are always adding new artwork.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
