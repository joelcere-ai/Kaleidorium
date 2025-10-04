"use client"

import { X } from "lucide-react"
import Image from "next/image"
import { useEffect, useState } from "react"

interface ImageOverlayProps {
  artwork_image: string
  alt: string
  onClose: () => void
}

export function ImageOverlay({ artwork_image, alt, onClose }: ImageOverlayProps) {
  const [isLandscape, setIsLandscape] = useState(false);

  // Check orientation
  useEffect(() => {
    const checkOrientation = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', () => {
      setTimeout(checkOrientation, 100);
    });

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  // Close on escape key press
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }

    document.addEventListener("keydown", handleEscapeKey)
    // Prevent scrolling when overlay is open
    document.body.style.overflow = "hidden"

    return () => {
      document.removeEventListener("keydown", handleEscapeKey)
      document.body.style.overflow = "auto"
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[200] bg-gray-100 flex items-center justify-center p-2 md:p-8" onClick={onClose}>
      <div 
        className={`relative ${isLandscape ? 'max-w-[95vw] max-h-[95vh]' : 'max-w-[90vw] max-h-[90vh]'}`} 
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-2 right-2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
          onClick={onClose}
        >
          <X className="h-6 w-6" />
          <span className="sr-only">Close</span>
        </button>
        <div className="bg-white/5 backdrop-blur-sm rounded-lg p-1">
          <img
            src={artwork_image || "/placeholder.svg"}
            alt={alt}
            className={`object-contain ${
              isLandscape 
                ? 'max-h-[90vh] max-w-[90vw] w-auto h-auto' 
                : 'max-h-[85vh] max-w-[85vw] w-auto h-auto'
            }`}
            style={{ 
              objectFit: 'contain',
              width: 'auto',
              height: 'auto',
              maxWidth: isLandscape ? '90vw' : '85vw',
              maxHeight: isLandscape ? '90vh' : '85vh'
            }}
          />
        </div>
      </div>
    </div>
  )
}

