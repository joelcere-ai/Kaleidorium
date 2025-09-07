"use client"

import React, { useState, useEffect } from 'react'

interface AnimatedLoadingProps {
  onComplete?: () => void
  duration?: number
}

export default function AnimatedLoading({ onComplete, duration = 3000 }: AnimatedLoadingProps) {
  const [visibleLetters, setVisibleLetters] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  
  const letters = ['K', 'a', 'l', 'e', 'i', 'd', 'o', 'r', 'i', 'u', 'm']
  const letterDelay = 180 // milliseconds between each letter - slightly faster

  useEffect(() => {
    const timer = setInterval(() => {
      setVisibleLetters(prev => {
        if (prev < letters.length) {
          return prev + 1
        } else {
          clearInterval(timer)
          // Wait a moment after all letters are shown, then complete
          setTimeout(() => {
            setIsComplete(true)
            if (onComplete) {
              onComplete()
            }
          }, 1000) // Slightly longer pause to appreciate the full word
          return prev
        }
      })
    }, letterDelay)

    return () => clearInterval(timer)
  }, [letters.length, onComplete])

  if (isComplete) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black z-[1000] flex items-center justify-center overflow-hidden">
      {/* Animated Kaleidorium Text - Optimized for mobile */}
      <div className="flex items-center justify-center px-6 max-w-full">
        {letters.map((letter, index) => (
          <span
            key={index}
            className={`
              font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 
              font-bold text-white select-none
              ${index < visibleLetters 
                ? 'letter-animate opacity-100' 
                : 'opacity-0'
              }
              ${index < visibleLetters && visibleLetters >= letters.length 
                ? 'letter-glow' 
                : ''
              }
            `}
            style={{
              animationDelay: `${index * 120}ms`,
              letterSpacing: index === 0 ? '0.08em' : '0.02em',
              textShadow: index < visibleLetters ? '0 0 15px rgba(255, 255, 255, 0.4)' : 'none',
              // Ensure crisp rendering on all devices
              WebkitFontSmoothing: 'antialiased',
              MozOsxFontSmoothing: 'grayscale',
              textRendering: 'optimizeLegibility'
            }}
          >
            {letter}
          </span>
        ))}
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
        <p className={`
          text-white/80 text-xs sm:text-sm md:text-base font-light tracking-widest text-center
          transition-all duration-1000 select-none
          ${visibleLetters >= letters.length ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
        `}
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