"use client"

import React, { useState, useEffect } from 'react'
import Image from 'next/image'

interface AnimatedLoadingProps {
  onComplete?: () => void
  duration?: number
}

export default function AnimatedLoading({ onComplete, duration = 3000 }: AnimatedLoadingProps) {
  const [isComplete, setIsComplete] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  
  // Debug logging
  useEffect(() => {
    console.log('AnimatedLoading component mounted')
  }, [])
  
  // Show logo for the specified duration, then complete
  useEffect(() => {
    console.log('Setting up loading timer...')
    const timer = setTimeout(() => {
      console.log('Loading timer completed')
      setIsComplete(true)
      if (onComplete) {
        onComplete()
      }
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onComplete])

  if (isComplete) {
    console.log('AnimatedLoading completed, returning null')
    return null
  }

  console.log('AnimatedLoading rendering...')
  return (
    <div className="fixed inset-0 bg-black z-[1000] flex items-center justify-center overflow-hidden">
      {/* Kaleidorium Logo - Optimized for mobile */}
      <div className="flex items-center justify-center px-6 max-w-full">
        {/* Always show text logo with enhanced visibility */}
        <div className="text-white text-center">
          <h1 
            className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold tracking-wide animate-pulse"
            style={{
              color: 'white',
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
              WebkitTextStroke: '1px rgba(255,255,255,0.3)',
              filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.5))'
            }}
          >
            Kaleidorium
          </h1>
        </div>
        
        {/* Also try to load the image in the background */}
        <Image
          src="/kaleidorium-logo.jpg"
          alt="Kaleidorium"
          width={400}
          height={200}
          className="hidden"
          onLoad={() => {
            console.log('Kaleidorium logo loaded successfully')
            setImageLoaded(true)
          }}
          onError={() => {
            console.error('Failed to load Kaleidorium logo')
            setImageError(true)
          }}
          priority
        />
      </div>

      {/* Enhanced loading indicator */}
      <div className="absolute bottom-20 sm:bottom-24 left-1/2 transform -translate-x-1/2">
        <div className="flex space-x-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-3 h-3 sm:w-4 sm:h-4 bg-white rounded-full loading-dot"
              style={{
                animationDelay: `${i * 0.4}s`,
                boxShadow: '0 0 10px rgba(255,255,255,0.8)'
              }}
            />
          ))}
        </div>
      </div>

      {/* Elegant tagline */}
      <div className="absolute bottom-10 sm:bottom-14 left-1/2 transform -translate-x-1/2 px-4">
        <p 
          className="text-white text-xs sm:text-sm md:text-base font-light tracking-widest text-center transition-all duration-1000 select-none opacity-100"
          style={{
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
            color: 'white',
            textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
          }}
        >
          Curated Art Discovery
        </p>
      </div>

      {/* Subtle gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-black to-gray-900 pointer-events-none" />
    </div>
  )
} 