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
  const letterDelay = 200 // milliseconds between each letter

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
          }, 800)
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
    <div className="fixed inset-0 bg-black z-[1000] flex items-center justify-center">
      {/* Animated Kaleidorium Text */}
      <div className="flex items-center justify-center px-4">
        {letters.map((letter, index) => (
          <span
            key={index}
            className={`
              font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white
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
              animationDelay: `${index * 100}ms`,
              letterSpacing: index === 0 ? '0.1em' : '0.05em',
              textShadow: index < visibleLetters ? '0 0 10px rgba(255, 255, 255, 0.3)' : 'none'
            }}
          >
            {letter}
          </span>
        ))}
      </div>

      {/* Enhanced loading indicator */}
      <div className="absolute bottom-16 sm:bottom-20 left-1/2 transform -translate-x-1/2">
        <div className="flex space-x-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-3 h-3 bg-white/60 rounded-full loading-dot"
              style={{
                animationDelay: `${i * 0.3}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Elegant tagline */}
      <div className="absolute bottom-8 sm:bottom-12 left-1/2 transform -translate-x-1/2">
        <p className={`
          text-white/70 text-sm sm:text-base font-light tracking-wider text-center
          transition-opacity duration-1000
          ${visibleLetters >= letters.length ? 'opacity-100' : 'opacity-0'}
        `}>
          Curated Art Discovery
        </p>
      </div>

      {/* Elegant fade-out animation when complete */}
      <div 
        className={`
          absolute inset-0 bg-black transition-opacity duration-1000
          ${visibleLetters >= letters.length ? 'opacity-0 pointer-events-none' : 'opacity-100'}
        `}
      />
    </div>
  )
} 