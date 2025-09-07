"use client"

import React, { useState, useRef, useEffect } from 'react'
import Image from 'next/image'

interface ProgressiveImageProps {
  src: string
  alt: string
  className?: string
  style?: React.CSSProperties
  aspectRatio?: string
  priority?: boolean
  onClick?: () => void
  onLoad?: () => void
}

export default function ProgressiveImage({
  src,
  alt,
  className = '',
  style,
  aspectRatio,
  priority = false,
  onClick,
  onLoad
}: ProgressiveImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    if (src) {
      setIsLoading(true)
      setIsError(false)
      setImageLoaded(false)
    }
  }, [src])

  const handleLoad = () => {
    setIsLoading(false)
    setImageLoaded(true)
    if (onLoad) onLoad()
  }

  const handleError = () => {
    setIsLoading(false)
    setIsError(true)
  }

  const containerStyle = {
    ...style,
    aspectRatio: aspectRatio || 'auto',
    position: 'relative' as const,
    overflow: 'hidden' as const,
  }

  return (
    <div 
      className={`relative overflow-hidden ${className}`} 
      style={containerStyle}
      onClick={onClick}
    >
      {/* Loading skeleton */}
      {isLoading && (
        <div 
          className="absolute inset-0 skeleton rounded-lg"
          style={{
            background: 'linear-gradient(90deg, #f0f0f0 0%, #e0e0e0 50%, #f0f0f0 100%)',
            backgroundSize: '200px 100%',
            animation: 'shimmer 1.5s infinite'
          }}
        />
      )}

      {/* Error state */}
      {isError && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm">Image unavailable</p>
          </div>
        </div>
      )}

      {/* Main image */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className={`
          w-full h-full object-cover transition-all duration-500 ease-out
          ${imageLoaded ? 'opacity-100 blur-0 scale-100' : 'opacity-0 blur-sm scale-105'}
        `}
        onLoad={handleLoad}
        onError={handleError}
        loading={priority ? 'eager' : 'lazy'}
        style={{
          filter: isLoading ? 'blur(8px)' : 'blur(0)',
          transform: isLoading ? 'scale(1.05)' : 'scale(1)',
        }}
      />

      {/* Overlay for additional effects */}
      <div 
        className={`
          absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-transparent
          transition-opacity duration-300
          ${imageLoaded ? 'opacity-0' : 'opacity-20'}
        `}
      />
    </div>
  )
} 