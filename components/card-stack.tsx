"use client"

import React, { useState, useEffect, useRef } from 'react'
import { ThumbsUp, ThumbsDown, Facebook, Instagram, MessageCircle, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ArtistNameWithBadge } from "@/components/artist-name-with-badge"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import type { Artwork } from "@/types/artwork"
import ProgressiveImage from "./progressive-image"
import { KuratorInsight } from "@/components/kurator-insight"

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

interface CardStackProps {
  artworks: Artwork[]
  currentIndex: number
  onLike: (artwork: Artwork) => void
  onDislike: (artwork: Artwork) => void
  onAddToCollection: (artwork: Artwork) => void | Promise<void | boolean>
  onNext: () => void
  onLoadMore: () => void
  onImageClick: (url: string, alt: string) => void
  loading: boolean
  showFallbackMessage?: boolean
  fallbackMessage?: string
  localPreferences?: LocalPreferences
  lastVisitDate?: string | null
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
  showFallbackMessage = false,
  fallbackMessage,
  localPreferences,
  lastVisitDate,
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
  // Only if we're not showing fallback message (which means we're filtering/searching)
  useEffect(() => {
    const remainingCards = artworks.length - currentIndex
    if (remainingCards <= 3 && !showFallbackMessage) {
      onLoadMore()
    }
  }, [currentIndex, artworks.length, onLoadMore, showFallbackMessage])

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

const handleAction = async (action: 'like' | 'dislike', artwork: Artwork) => {
    switch (action) {
      case 'like': {
      await onLike(artwork)
      const added = await onAddToCollection(artwork)
      if (added !== false) {
        toast({
          title: "Added to your collection",
          description: `"${artwork.title}" by ${artwork.artist}`,
        })
      }
        break
      }
      case 'dislike':
      await onDislike(artwork)
        toast({
          title: "Disliked!",
          description: `"${artwork.title}" by ${artwork.artist}`,
        })
        break
    }
    // Don't call onNext() - keep current card visible, only upcoming cards will refresh
  }


  if (!visibleCards.length) {
    return (
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="w-full flex flex-col p-4 sm:p-6 lg:p-8 bg-[#FAFAF8] relative">
          <div className="flex items-center justify-center p-8">
            {showFallbackMessage ? (
              <div className="text-center p-6 bg-[#FAFAF8] border border-[#E6E4DF] rounded-[16px]">
                <p className="text-sm text-[#5F5F5A]">
                  {fallbackMessage ||
                    "No artwork found. Try a different search or remove some filters."}
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
        <div className="w-full flex flex-col p-4 sm:p-6 lg:p-8 bg-[#FAFAF8] relative">
        

        {/* Cards Stack - Vertical Layout */}
        <div className="flex-1 max-w-7xl mx-auto w-full space-y-6">
          {visibleCards.map(({ artwork, index }, cardIndex) => (
            <div
              key={artwork.id}
              className="transition-all duration-300 ease-out"
            >
              <div className="bg-white rounded-[20px] border border-[#E6E4DF] overflow-hidden" style={{ boxShadow: '0 2px 10px rgba(20,20,20,0.03)' }}>
                <div className="flex flex-col lg:flex-row">
                  {/* Artwork Image Section */}
                  <div className="w-full lg:w-[65%] flex-shrink-0">
                    <div
                      className="relative h-[360px] lg:h-[460px] cursor-zoom-in bg-[#FAFAF8]"
                      onClick={() => onImageClick(artwork.artwork_image, artwork.title)}
                    >
                      <ProgressiveImage
                        src={artwork.artwork_image || "/placeholder.svg"}
                        alt={artwork.title}
                        className="w-full h-full p-5"
                        style={{ objectFit: 'contain' }}
                        priority={cardIndex === 0}
                      />
                    </div>
                    
                    {/* Card Info Section */}
                    <div className="px-5 py-4 border-t border-[#E6E4DF]">
                      <div className="mb-3">
                        <h3 className="artwork-title mb-1">
                          {artwork.title}
                        </h3>
                        <div className="artwork-artist">
                          by <ArtistNameWithBadge 
                            artistName={artwork.artist}
                            artistId={(artwork as any).artist_id}
                            className="inline"
                          />
                        </div>
                      </div>

                      {/* Kurator Insight */}
                      {localPreferences && (
                        <KuratorInsight artwork={artwork} localPreferences={localPreferences} lastVisitDate={lastVisitDate} />
                      )}

                      {/* Action Buttons */}
                      <div className="flex items-center justify-center gap-3 sm:gap-6 mt-4">
            <Button
              size="default"
              onClick={() => handleAction('dislike', artwork)}
              className="flex-1 sm:flex-none min-w-[100px] active:scale-95 hover:brightness-[0.97] transition-all duration-150"
              style={{ backgroundColor: '#FBEFF0', borderColor: '#E7C4C7', borderWidth: '1px', borderStyle: 'solid', color: '#A35D66', height: '42px', borderRadius: '12px', boxShadow: 'none' }}
            >
              <ThumbsDown className="w-4 h-4 mr-1.5" style={{ color: '#A35D66' }} />
              <span className="hidden sm:inline">Dislike</span>
            </Button>
            
            <Button
              size="default"
              onClick={() => handleAction('like', artwork)}
              className="flex-1 sm:flex-none min-w-[100px] active:scale-95 hover:brightness-[0.97] transition-all duration-150"
              style={{ backgroundColor: '#EDF6F0', borderColor: '#B8D8C1', borderWidth: '1px', borderStyle: 'solid', color: '#3E7C59', height: '42px', borderRadius: '12px', boxShadow: 'none' }}
            >
              <ThumbsUp className="w-4 h-4 mr-1.5" style={{ color: '#3E7C59' }} />
              <span className="hidden sm:inline">Like</span>
            </Button>
                      </div>
                    </div>
                  </div>

                  {/* Integrated Information Panel */}
                  <div className="w-full lg:w-[35%] border-t lg:border-t-0 lg:border-l border-[#E6E4DF] bg-white">
                    <div className="p-5 space-y-5">
                      {/* Enhanced Description */}
                      <div>
                        <h3 className="artwork-section-title mb-3">About this artwork</h3>
                        <p className="artwork-description">{artwork.description}</p>
                      </div>

                      {/* Artwork Information */}
                      <div className="mt-5">
                        <div className="flex flex-wrap items-center gap-3 artwork-meta">
                          {artwork.year && <span>{artwork.year}</span>}
                          {artwork.medium && <span>{artwork.medium}</span>}
                          {artwork.dimensions && <span>{formatDimensions(artwork.dimensions)}</span>}
                          {artwork.price && (
                            <span>
                              {artwork.price.toLowerCase() === 'sold' || artwork.price.toLowerCase() === 'enquire' || artwork.price.toLowerCase() === 'not for sale'
                                ? artwork.price
                                : artwork.currency
                                  ? `${artwork.price} ${artwork.currency}`
                                  : artwork.price
                              }
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Enhanced Tags */}
                      <div className="space-y-3 mt-8">
                        <h3 className="artwork-section-title mb-3">Style & Subject</h3>
                        <div className="flex flex-wrap gap-2">
                          {[artwork.genre, artwork.style, artwork.subject, artwork.colour, ...(artwork.tags || [])]
                            .filter((tag, idx, arr) => tag && arr.indexOf(tag) === idx)
                            .length > 0 ? (
                            [artwork.genre, artwork.style, artwork.subject, artwork.colour, ...(artwork.tags || [])]
                              .filter((tag, idx, arr) => tag && arr.indexOf(tag) === idx)
                              .map((tag) => (
                                <span 
                                  key={tag} 
                                  className="artwork-chip"
                                >
                                  {tag}
                                </span>
                              ))
                          ) : (
                            <span className="text-muted-foreground text-sm italic">No tags available</span>
                          )}
                        </div>
                      </div>

                      {/* View on Artist Website Button - Always show if link exists */}
                      {artwork.link && artwork.link.trim() !== '' && (
                        <div className="mt-6">
                          <button
                            className="artwork-cta-btn"
                            onClick={() => {
                              try {
                                let url = artwork.link!.trim()
                                if (!url.startsWith('http://') && !url.startsWith('https://')) {
                                  url = 'https://' + url
                                }
                                new URL(url)
                                window.open(url, '_blank', 'noopener,noreferrer');
                              } catch (error) {
                                console.error('Invalid artist URL:', artwork.link)
                              }
                            }}
                          >
                            View on artist's website
                          </button>
                        </div>
                      )}

                    {/* Social Media Share Buttons */}
                    <div className="mt-4 py-3 px-4 bg-[#FAFAF8] rounded-xl border border-[#E6E4DF]">
                      <p className="artwork-meta text-center mb-3">Share this artwork</p>
                      <div className="flex justify-center gap-2">
                          <button 
                            className="share-icon-btn"
                            onClick={() => {
                              const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://kaleidorium.com'
                              const shareUrl = `${baseUrl}/?artworkId=${artwork.id}`
                              const text = `Check out "${artwork.title}" by ${artwork.artist} on Kaleidorium`
                              window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`, '_blank', 'noopener,noreferrer');
                            }}
                            title="Share on X"
                          >
                            <XIcon />
                          </button>
                          <button 
                            className="share-icon-btn"
                            onClick={() => {
                              const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://kaleidorium.com'
                              const shareUrl = `${baseUrl}/?artworkId=${artwork.id}`
                              const text = `Check out "${artwork.title}" by ${artwork.artist} on Kaleidorium`
                              window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
                            }}
                            title="Share on Facebook"
                          >
                            <Facebook />
                          </button>
                          <button 
                            className="share-icon-btn"
                            onClick={async () => {
                              const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://kaleidorium.com'
                              const shareUrl = `${baseUrl}/?artworkId=${artwork.id}`
                              const text = `Check out "${artwork.title}" by ${artwork.artist} on Kaleidorium\n\n${shareUrl}`
                              try {
                                await navigator.clipboard.writeText(text)
                                alert('Link copied! Paste it in your Instagram story or post.')
                              } catch (err) {
                                console.error('Failed to copy:', err)
                              }
                            }}
                            title="Share on Instagram (Copy Link)"
                          >
                            <Instagram />
                          </button>
                          <button 
                            className="share-icon-btn"
                            onClick={() => {
                              const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://kaleidorium.com'
                              const shareUrl = `${baseUrl}/?artworkId=${artwork.id}`
                              const text = `Check out "${artwork.title}" by ${artwork.artist} on Kaleidorium`
                              const whatsappText = `${text}\n\n${shareUrl}`
                              window.open(`https://wa.me/?text=${encodeURIComponent(whatsappText)}`, '_blank', 'noopener,noreferrer');
                            }}
                            title="Share on WhatsApp"
                          >
                            <MessageCircle />
                          </button>
                          <button 
                            className="share-icon-btn"
                            onClick={async () => {
                              const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://kaleidorium.com'
                              const shareUrl = `${baseUrl}/?artworkId=${artwork.id}`
                              try {
                                await navigator.clipboard.writeText(shareUrl)
                                alert('Link copied to clipboard!')
                              } catch (err) {
                                console.error('Failed to copy:', err)
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
                            <Copy />
                          </button>
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
        {/* Only show loading spinner when not showing fallback message (i.e., not filtering/searching) */}
        {/* Also hide when there's only one artwork (likely a specific artwork loaded via URL) */}
        {loading && !showFallbackMessage && artworks.length > 1 && (
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-2 text-sm text-[#8A8A84]">
              <div className="w-4 h-4 border-2 border-[#E6E4DF] border-t-[#1E1E1C] rounded-full animate-spin"></div>
              Loading more artworks...
            </div>
          </div>
        )}
        
        {!loading && visibleCardCount >= artworks.length - currentIndex && artworks.length > 0 && (
          <div className="mt-8 text-center p-6 border-t border-[#E6E4DF]">
            <h3 className="text-lg font-semibold text-[#5F5F5A] mb-2">You've seen all the artworks!</h3>
            <p className="text-sm text-[#8A8A84]">Check back later for new additions to our collection</p>
          </div>
        )}
        
        {/* Fallback message when no filters match */}
          {showFallbackMessage && (
          <div className="mt-8 text-center p-6 bg-[#FAFAF8] border border-[#E6E4DF] rounded-[16px]">
            <p className="text-sm text-[#5F5F5A]">
              {fallbackMessage ||
                "No artwork found. Try a different search or remove some filters."}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
