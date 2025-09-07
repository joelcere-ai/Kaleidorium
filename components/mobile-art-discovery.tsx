"use client"

import { useState, useRef, useEffect } from "react"
import { Heart, ThumbsUp, ThumbsDown, Plus, Menu, Info, Search, Palette, Mail, User, ArrowLeft, Trash, X } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import type { Artwork } from "@/types/artwork"

interface MobileArtDiscoveryProps {
  artworks: Artwork[]
  currentIndex: number
  onNext: () => void
  onLike: (artwork: Artwork) => void
  onDislike: (artwork: Artwork) => void
  onAddToCollection: (artwork: Artwork) => void
  setView: (view: "discover" | "collection" | "profile" | "for-artists" | "about" | "contact") => void
  view: "discover" | "collection"
  collection: Artwork[]
  onRemoveFromCollection: (id: string) => void
  isLandscape?: boolean
  isPortrait?: boolean
  screenWidth?: number
  screenHeight?: number
}

export default function MobileArtDiscovery({
  artworks,
  currentIndex,
  onNext,
  onLike,
  onDislike,
  onAddToCollection,
  setView,
  view = "discover",
  collection = [],
  onRemoveFromCollection,
  isLandscape = false,
  isPortrait = true,
  screenWidth = 0,
  screenHeight = 0,
}: MobileArtDiscoveryProps) {
  const { toast } = useToast();
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | 'up' | null>(null);
  const [swipeDistance, setSwipeDistance] = useState(0);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentCollectionIndex, setCurrentCollectionIndex] = useState(0);
  
  // Modal swipe state
  const modalStartX = useRef<number>(0);
  const modalStartY = useRef<number>(0);
  const modalCurrentX = useRef<number>(0);
  const modalIsDragging = useRef<boolean>(false);
  const [modalSwipeDistance, setModalSwipeDistance] = useState(0);
  const [isModalAnimating, setIsModalAnimating] = useState(false);
  
  // Add button animation states
  const [buttonStates, setButtonStates] = useState<{
    dislike: boolean;
    info: boolean;
    add: boolean;
    like: boolean;
  }>({
    dislike: false,
    info: false,
    add: false,
    like: false
  });
  
  // Full-screen artwork view state
  const [showFullscreenArtwork, setShowFullscreenArtwork] = useState(false);
  const [fullscreenImageLoaded, setFullscreenImageLoaded] = useState(false);
  
  const cardRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const currentX = useRef(0);
  const currentY = useRef(0);
  const isDragging = useRef(false);

  // Prevent pull-to-refresh when modal is open
  useEffect(() => {
    if (showInfoModal) {
      // Prevent pull-to-refresh
      document.body.style.overscrollBehavior = 'none';
      document.body.style.touchAction = 'pan-x pan-y';
      document.documentElement.style.overscrollBehavior = 'none';
    } else {
      // Restore default behavior
      document.body.style.overscrollBehavior = '';
      document.body.style.touchAction = '';
      document.documentElement.style.overscrollBehavior = '';
    }
    
    return () => {
      // Cleanup on unmount
      document.body.style.overscrollBehavior = '';
      document.body.style.touchAction = '';
      document.documentElement.style.overscrollBehavior = '';
    };
  }, [showInfoModal]);

  const currentArtwork = artworks[currentIndex];

  // Handle keyboard shortcuts for fullscreen
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showFullscreenArtwork) {
        handleFullscreenClose();
      }
    };

    if (showFullscreenArtwork) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when fullscreen is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [showFullscreenArtwork]);

  // Calculate optimal image dimensions based on orientation
  const getImageContainerStyle = () => {
    if (isLandscape && screenWidth > 0 && screenHeight > 0) {
      // In landscape, use more of the available screen space
      const headerHeight = 72; // Approximate header height
      const buttonAreaHeight = 120; // Increased for better touch targets
      const availableHeight = screenHeight - headerHeight - buttonAreaHeight;
      const availableWidth = screenWidth - 32; // Account for padding
      
      // Use 90% of available space in landscape for a more immersive experience
      return {
        width: `${availableWidth * 0.95}px`,
        height: `${availableHeight * 0.9}px`,
        maxWidth: '100%',
        maxHeight: '100%'
      };
    } else {
      // Portrait mode uses the original responsive approach
      return {};
    }
  };

  // Get dynamic classes based on orientation
  const getContainerClasses = () => {
    if (isLandscape) {
      return "fixed inset-0 bg-white z-50 flex flex-col overflow-hidden";
    }
    return "fixed inset-0 bg-white z-50 flex flex-col";
  };

  const getMainAreaClasses = () => {
    if (isLandscape) {
      return "flex-1 relative overflow-hidden bg-gray-50 flex items-center justify-center";
    }
    return "flex-1 relative overflow-hidden bg-gray-50";
  };

  const getCardClasses = () => {
    if (isLandscape) {
      return "relative rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 ease-out bg-white max-w-full max-h-full transform hover:scale-[1.01]";
    }
    return "absolute inset-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 ease-out bg-white transform hover:scale-[1.01]";
  };

  const getImageClasses = () => {
    if (isLandscape) {
      return "object-contain w-full h-full transition-opacity duration-300";
    }
    return "object-cover transition-opacity duration-300";
  };

  // Modal swipe handlers
  const handleModalTouchStart = (e: React.TouchEvent) => {
    if (isModalAnimating) return;
    
    const touch = e.touches[0];
    modalStartX.current = touch.clientX;
    modalStartY.current = touch.clientY;
    modalIsDragging.current = true;
  };

  const handleModalTouchMove = (e: React.TouchEvent) => {
    if (!modalIsDragging.current || isModalAnimating) return;
    
    const touch = e.touches[0];
    modalCurrentX.current = touch.clientX - modalStartX.current;
    const currentY = touch.clientY - modalStartY.current;
    
    // Only handle horizontal swipes (ignore vertical scrolling)
    if (Math.abs(modalCurrentX.current) > Math.abs(currentY) && Math.abs(modalCurrentX.current) > 10) {
      e.preventDefault(); // Prevent vertical scrolling when swiping horizontally
      setModalSwipeDistance(modalCurrentX.current);
    }
  };

  const handleModalTouchEnd = () => {
    if (!modalIsDragging.current || isModalAnimating) return;
    
    modalIsDragging.current = false;
    const distance = Math.abs(modalCurrentX.current);
    
    if (distance > 100) {
      // Trigger navigation
      setIsModalAnimating(true);
      
      if (modalCurrentX.current > 0) {
        // Swipe right - Go to previous artwork
        navigateToCollectionItem(currentCollectionIndex - 1);
      } else {
        // Swipe left - Go to next artwork
        navigateToCollectionItem(currentCollectionIndex + 1);
      }
      
      // Reset after animation
      setTimeout(() => {
        setModalSwipeDistance(0);
        setIsModalAnimating(false);
      }, 300);
    } else {
      // Snap back
      setModalSwipeDistance(0);
    }
    
    modalCurrentX.current = 0;
  };

  const navigateToCollectionItem = (newIndex: number) => {
    if (newIndex < 0 || newIndex >= collection.length) return;
    
    setCurrentCollectionIndex(newIndex);
    setSelectedArtwork(collection[newIndex]);
  };

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
        <div className="flex-1 overflow-y-auto p-4">
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
                  <div className={`flex ${isLandscape ? 'flex-col' : ''}`} onClick={() => handleCollectionItemTap(artwork)}>
                    {/* Artwork Image */}
                    <div className={`${isLandscape ? 'w-full aspect-square' : 'w-24 h-24'} flex-shrink-0 relative`}>
                      <img
                        src={artwork.artwork_image || "/placeholder.svg"}
                        alt={artwork.title}
                        className="w-full h-full object-cover"
                      />
                      {/* Tap indicator overlay for collection items */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
                        <div className="bg-black/50 rounded-full p-2 backdrop-blur-sm">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                          </svg>
                        </div>
                      </div>
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
                        onClick={() => {
                          const artworkIndex = collection.findIndex(item => item.id === artwork.id);
                          setCurrentCollectionIndex(artworkIndex);
                          setSelectedArtwork(artwork);
                          setShowInfoModal(true);
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
                    setView("discover");
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
                    setView("collection");
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
                    setView("for-artists");
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
                    setView("about");
                    setShowMenuModal(false);
                  }}
                >
                  <Info className="mr-3 h-5 w-5" />
                  About
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-black hover:bg-gray-100"
                  onClick={() => {
                    setView("contact");
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
                    setView("profile");
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

        {/* Artwork Info Modal */}
        {showInfoModal && collection.length > 0 && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
            <div 
              className={`bg-white rounded-lg w-full max-h-[90vh] overflow-y-auto ${isLandscape ? 'max-w-2xl' : 'max-w-md'}`}
              onTouchStart={handleModalTouchStart}
              onTouchMove={handleModalTouchMove}
              onTouchEnd={handleModalTouchEnd}
              style={{
                transform: `translateX(${modalSwipeDistance}px)`,
                transition: isModalAnimating ? 'transform 0.3s ease-out' : 'none'
              }}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-black">{collection[currentCollectionIndex]?.title}</h2>
                    {/* Position indicator */}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm text-gray-500">
                        {currentCollectionIndex + 1} of {collection.length}
                      </span>
                      <div className="flex gap-1">
                        {collection.map((_, index) => (
                          <div
                            key={index}
                            className={`w-2 h-2 rounded-full transition-colors ${
                              index === currentCollectionIndex ? 'bg-blue-500' : 'bg-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowInfoModal(false);
                      setSelectedArtwork(null);
                      setModalSwipeDistance(0);
                    }}
                    className="text-black hover:bg-gray-100"
                  >
                    ×
                  </Button>
                </div>

                {/* Swipe hint */}
                <div className="text-center mb-4">
                  <span className="text-xs text-gray-400">← Swipe to browse collection →</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="font-semibold text-black">Artist:</span>
                    <span className="ml-2 text-gray-700">{collection[currentCollectionIndex]?.artist}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-black">Price:</span>
                    <span className="ml-2 text-gray-700">{collection[currentCollectionIndex]?.price}</span>
                  </div>
                  {collection[currentCollectionIndex]?.medium && (
                    <div>
                      <span className="font-semibold text-black">Medium:</span>
                      <span className="ml-2 text-gray-700">{collection[currentCollectionIndex].medium}</span>
                    </div>
                  )}
                  {collection[currentCollectionIndex]?.dimensions && (
                    <div>
                      <span className="font-semibold text-black">Dimensions:</span>
                      <span className="ml-2 text-gray-700">{collection[currentCollectionIndex].dimensions}</span>
                    </div>
                  )}
                  {collection[currentCollectionIndex]?.description && (
                    <div>
                      <span className="font-semibold text-black">Description:</span>
                      <p className="mt-1 text-gray-700">{collection[currentCollectionIndex].description}</p>
                    </div>
                  )}
                  
                  {/* Tags Section */}
                  {(() => {
                    const currentArtwork = collection[currentCollectionIndex];
                    if (!currentArtwork) return null;
                    
                    const allTags = [
                      currentArtwork.genre,
                      currentArtwork.style,
                      currentArtwork.subject,
                      currentArtwork.colour,
                      ...(currentArtwork.tags || [])
                    ].filter(
                      (tag, idx, arr) => tag && arr.indexOf(tag) === idx // remove falsy and duplicates
                    );
                    
                    return allTags.length > 0 && (
                      <div>
                        <span className="font-semibold text-black">Tags:</span>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {allTags.map((tag) => (
                            <span 
                              key={tag} 
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Navigation hints and remove button */}
                <div className="mt-6 flex justify-between items-center">
                  <div className="flex gap-2">
                    {currentCollectionIndex > 0 && (
                      <button
                        onClick={() => navigateToCollectionItem(currentCollectionIndex - 1)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        ← Previous
                      </button>
                    )}
                    {currentCollectionIndex < collection.length - 1 && (
                      <button
                        onClick={() => navigateToCollectionItem(currentCollectionIndex + 1)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Next →
                      </button>
                    )}
                  </div>
                  
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      const currentArtwork = collection[currentCollectionIndex];
                      if (currentArtwork?.id) {
                        onRemoveFromCollection(currentArtwork.id);
                        // Adjust index if we removed the last item
                        if (currentCollectionIndex >= collection.length - 1) {
                          setCurrentCollectionIndex(Math.max(0, collection.length - 2));
                        }
                        // Close modal if collection becomes empty
                        if (collection.length <= 1) {
                          setShowInfoModal(false);
                          setSelectedArtwork(null);
                        }
                        toast({
                          title: "Removed from Collection",
                          description: `"${currentArtwork.title}" has been removed from your collection`,
                        });
                      }
                    }}
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Discovery View
  if (!currentArtwork) {
    return (
      <div className={getContainerClasses()}>
        <div className="flex items-center justify-center h-full">
          <p className="text-black text-xl">No more artworks to discover!</p>
        </div>
      </div>
    );
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (showInfoModal || isAnimating) return;
    
    const touch = e.touches[0];
    startX.current = touch.clientX;
    startY.current = touch.clientY;
    isDragging.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || showInfoModal || isAnimating) return;
    
    const touch = e.touches[0];
    currentX.current = touch.clientX - startX.current;
    currentY.current = touch.clientY - startY.current;
    
    // Determine if this is primarily horizontal or vertical movement
    if (Math.abs(currentX.current) > Math.abs(currentY.current)) {
      // Horizontal swipe
      const distance = currentX.current;
      setSwipeDistance(distance);
      
      if (distance > 50) {
        setSwipeDirection('right');
      } else if (distance < -50) {
        setSwipeDirection('left');
      } else {
        setSwipeDirection(null);
      }
      
      // Apply transform to card
      if (cardRef.current) {
        const rotation = distance * 0.1;
        const opacity = 1 - Math.abs(distance) / 300;
        cardRef.current.style.transform = `translateX(${distance}px) rotate(${rotation}deg)`;
        cardRef.current.style.opacity = opacity.toString();
      }
    } else {
      // Vertical swipe - show upward swipe indicator
      if (currentY.current < -50) {
        setSwipeDirection('up');
      } else {
        setSwipeDirection(null);
      }
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging.current || showInfoModal || isAnimating) return;
    
    isDragging.current = false;
    const horizontalDistance = Math.abs(currentX.current);
    const verticalDistance = Math.abs(currentY.current);
    
    // Check for vertical swipe (upward) first
    if (verticalDistance > horizontalDistance && currentY.current < -100) {
      // Upward swipe - show info drawer
      handleButtonAction('info');
    } else if (horizontalDistance > 100) {
      // Horizontal swipe
      setIsAnimating(true);
      
      if (currentX.current > 0) {
        // Swipe right - Like
        onLike(currentArtwork);
        toast({
          title: "Liked! 👍",
          description: `Added "${currentArtwork.title}" to your liked artworks`,
        });
      } else {
        // Swipe left - Dislike
        onDislike(currentArtwork);
        toast({
          title: "Disliked 👎",
          description: `We'll show you less art like "${currentArtwork.title}"`,
        });
      }
      
      // Animate card out
      if (cardRef.current) {
        const finalX = currentX.current > 0 ? (screenWidth || window.innerWidth) : -(screenWidth || window.innerWidth);
        cardRef.current.style.transform = `translateX(${finalX}px) rotate(${currentX.current * 0.2}deg)`;
        cardRef.current.style.opacity = '0';
      }
      
      // Move to next artwork after animation
      setTimeout(() => {
        onNext();
        resetCard();
        setIsAnimating(false);
      }, 300);
    } else {
      // Snap back
      resetCard();
    }
    
    setSwipeDirection(null);
    setSwipeDistance(0);
    currentX.current = 0;
    currentY.current = 0;
  };

  const resetCard = () => {
    if (cardRef.current) {
      cardRef.current.style.transform = 'translateX(0px) rotate(0deg)';
      cardRef.current.style.opacity = '1';
    }
  };


  // Enhanced button action handler with micro-interactions
  const handleButtonAction = async (action: 'like' | 'dislike' | 'add' | 'info') => {
    if (!currentArtwork || isAnimating) return;

    // Trigger haptic feedback if available
    if (navigator.vibrate) {
      navigator.vibrate(50); // Subtle haptic feedback
    }

    // Button animation
    setButtonStates(prev => ({ ...prev, [action]: true }));
    setTimeout(() => {
      setButtonStates(prev => ({ ...prev, [action]: false }));
    }, 200);


    switch (action) {
      case 'like':
        onLike(currentArtwork);
        break;
      case 'dislike':
        onDislike(currentArtwork);
        break;
      case 'add':
        onAddToCollection(currentArtwork);
        break;
      case 'info':
        setSelectedArtwork(currentArtwork);
        setShowInfoModal(true);
        break;
    }
  };

  // Handle artwork tap for full-screen view
  const handleArtworkTap = () => {
    if (currentArtwork && !isAnimating) {
      setFullscreenImageLoaded(false);
      setShowFullscreenArtwork(true);
      // Haptic feedback for fullscreen
      if (navigator.vibrate) {
        navigator.vibrate(30);
      }
    }
  };

  // Handle fullscreen close
  const handleFullscreenClose = () => {
    setShowFullscreenArtwork(false);
    setFullscreenImageLoaded(false);
  };

  // Handle collection item tap for full-screen view
  const handleCollectionItemTap = (artwork: Artwork) => {
    setSelectedArtwork(artwork);
    setFullscreenImageLoaded(false);
    setShowFullscreenArtwork(true);
    // Haptic feedback for fullscreen
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }
  };

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

      {/* Main Artwork Area */}
      <div className={getMainAreaClasses()}>
        <div
          ref={cardRef}
          className={`${getCardClasses()} cursor-pointer`}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={handleArtworkTap}
          style={{ 
            willChange: 'transform',
            ...getImageContainerStyle()
          }}
        >
          <div className="relative w-full h-full rounded-2xl overflow-hidden">
            <Image
              src={currentArtwork.artwork_image}
              alt={currentArtwork.title}
              fill={!isLandscape}
              width={isLandscape ? screenWidth : undefined}
              height={isLandscape ? screenHeight : undefined}
              className={getImageClasses()}
              sizes={isLandscape ? `${screenWidth}px` : "100vw"}
              priority
              draggable={false}
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

            {swipeDirection === 'up' && (
              <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                <div className="bg-blue-500 rounded-full p-4">
                  <Info className="w-8 h-8 text-white fill-white" />
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Enhanced Action Buttons with better spacing and micro-interactions */}
      <div className={`bg-white border-t border-gray-100 p-6 z-10 ${isLandscape ? 'flex-shrink-0' : ''} shadow-lg`}>
        <div className={`flex items-center justify-center gap-6 ${isLandscape ? 'gap-12' : ''}`}>
          <Button
            variant="outline"
            size="icon"
            className={`w-16 h-16 rounded-full border-red-300 hover:bg-red-50 hover:border-red-400 
              transition-all duration-200 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg
              ${buttonStates.dislike ? 'scale-95 bg-red-50' : ''}`}
            onClick={() => handleButtonAction('dislike')}
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
            onClick={() => handleButtonAction('info')}
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
            onClick={() => handleButtonAction('add')}
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
            onClick={() => handleButtonAction('like')}
            disabled={isAnimating}
          >
            <ThumbsUp className="w-7 h-7 text-green-600" />
          </Button>
        </div>
        
      </div>

      {/* Info Drawer for Discovery View */}
      {showInfoModal && (
        <div 
          className="fixed inset-0 bg-black/20 z-[99]"
          onClick={() => setShowInfoModal(false)}
        />
      )}
      
      <div 
        className={`fixed inset-x-0 bottom-0 bg-white rounded-t-2xl shadow-2xl transform transition-transform duration-300 ease-out z-[100] ${
          showInfoModal ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ maxHeight: '80vh' }}
        onTouchStart={(e) => {
          // Prevent pull-to-refresh when drawer is open
          e.stopPropagation();
          const startY = e.touches[0].clientY;
          const startTime = Date.now();
          
          const handleTouchMove = (moveEvent: TouchEvent) => {
            moveEvent.preventDefault(); // Prevent default browser behavior
            const currentY = moveEvent.touches[0].clientY;
            const deltaY = currentY - startY;
            const deltaTime = Date.now() - startTime;
            
            // Only close if swiping down with sufficient distance and speed
            if (deltaY > 80 && deltaTime < 500) {
              setShowInfoModal(false);
              document.removeEventListener('touchmove', handleTouchMove);
            }
          };
          
          const handleTouchEnd = () => {
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
          };
          
          document.addEventListener('touchmove', handleTouchMove, { passive: false });
          document.addEventListener('touchend', handleTouchEnd);
        }}
      >
        {/* Drag Handle */}
        <div 
          className="flex justify-center pt-3 pb-2 cursor-pointer"
          onClick={() => setShowInfoModal(false)}
        >
          <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 overflow-y-auto"
          style={{ maxHeight: 'calc(80vh - 60px)' }}
          onTouchStart={(e) => {
            // Prevent parent touch events when scrolling content
            e.stopPropagation();
          }}
        >
          {currentArtwork && (
            <>
              <div className="mb-4">
                <h2 className="text-xl font-bold text-black">{currentArtwork.title}</h2>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="font-semibold text-black">Artist:</span>
                  <span className="ml-2 text-gray-700">{currentArtwork.artist}</span>
                </div>
                <div>
                  <span className="font-semibold text-black">Price:</span>
                  <span className="ml-2 text-gray-700">{currentArtwork.price}</span>
                </div>
                {currentArtwork.medium && (
                  <div>
                    <span className="font-semibold text-black">Medium:</span>
                    <span className="ml-2 text-gray-700">{currentArtwork.medium}</span>
                  </div>
                )}
                {currentArtwork.dimensions && (
                  <div>
                    <span className="font-semibold text-black">Dimensions:</span>
                    <span className="ml-2 text-gray-700">{currentArtwork.dimensions}</span>
                  </div>
                )}
                {currentArtwork.description && (
                  <div>
                    <span className="font-semibold text-black">Description:</span>
                    <p className="mt-1 text-gray-700">{currentArtwork.description}</p>
                  </div>
                )}
                
                {/* Tags Section */}
                {(() => {
                  const allTags = [
                    currentArtwork.genre,
                    currentArtwork.style,
                    currentArtwork.subject,
                    currentArtwork.colour,
                    ...(currentArtwork.tags || [])
                  ].filter(
                    (tag, idx, arr) => tag && arr.indexOf(tag) === idx // remove falsy and duplicates
                  );
                  
                  return allTags.length > 0 && (
                    <div>
                      <span className="font-semibold text-black">Tags:</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {allTags.map((tag) => (
                          <span 
                            key={tag} 
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Backdrop for drawer */}
      {showInfoModal && (
        <div 
          className="fixed inset-0 bg-black/30 z-[99]"
          onClick={() => setShowInfoModal(false)}
        />
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
                  setView("discover");
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
                  setView("collection");
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
                  setView("for-artists");
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
                  setView("about");
                  setShowMenuModal(false);
                }}
              >
                <Info className="mr-3 h-5 w-5" />
                About
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-black hover:bg-gray-100"
                onClick={() => {
                  setView("contact");
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
                  setView("profile");
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

      {/* Full-Screen Artwork Overlay */}
      {showFullscreenArtwork && (view === "discover" ? currentArtwork : selectedArtwork) && (
        <div className="fixed inset-0 bg-black z-[200] flex items-center justify-center">
          {/* Full-screen image */}
          <div className="relative w-full h-full flex items-center justify-center">
            {!fullscreenImageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
              </div>
            )}
            <img
              src={(view === "discover" ? currentArtwork : selectedArtwork)?.artwork_image}
              alt={(view === "discover" ? currentArtwork : selectedArtwork)?.title}
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
  );
} 