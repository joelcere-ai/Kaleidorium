"use client"

import React, { useState, useEffect } from 'react'

interface AnimatedLoadingProps {
  onComplete?: () => void
  duration?: number
}

export default function AnimatedLoading({ onComplete, duration = 3000 }: AnimatedLoadingProps) {
  const [isComplete, setIsComplete] = useState(false)
  
  // Show logo for the specified duration, then complete
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsComplete(true)
      if (onComplete) {
        onComplete()
      }
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onComplete])

  if (isComplete) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black z-[1000] flex items-center justify-center overflow-hidden">
      {/* Kaleidorium Logo - Optimized for mobile */}
      <div className="flex items-center justify-center px-6 max-w-full">
        <img
          src="/kaleidorium-logo.jpg"
          alt="Kaleidorium"
          className="max-w-[80%] max-h-[60%] object-contain animate-pulse"
          style={{
            filter: 'brightness(1.1) contrast(1.1)',
            // Ensure crisp rendering on all devices
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
            textRendering: 'optimizeLegibility'
          }}
        />
      </div>

      {/* Enhanced loading indicator */}
      <div className="absolute bottom-20 sm:bottom-24 left-1/2 transform -translate-x-1/2">
        <div className="flex space-x-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 sm:w-3 sm:h-3 bg-white/70 rounded-full loading-dot"
              style={{
                animationDelay: `${i * 0.4}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Elegant tagline */}
      <div className="absolute bottom-10 sm:bottom-14 left-1/2 transform -translate-x-1/2 px-4">
        <p className="text-white/80 text-xs sm:text-sm md:text-base font-light tracking-widest text-center transition-all duration-1000 select-none opacity-100"
        style={{
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale'
        }}>
          Curated Art Discovery
        </p>
      </div>

      {/* Subtle gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-black to-gray-900 pointer-events-none" />
    </div>
  )
} 