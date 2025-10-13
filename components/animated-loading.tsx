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
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'black',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        padding: '20px'
      }}
    >
      {/* Logo with text */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
          <img 
            src="/logos/logo-large-64x64.svg" 
            alt="Kaleidorium Logo" 
            style={{ width: '48px', height: '48px', marginRight: '16px' }}
          />
        </div>
        <h1 
          style={{
            color: 'white',
            fontSize: '34px',
            fontWeight: 'bold',
            fontFamily: 'serif',
            margin: 0,
            textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
            letterSpacing: '2px'
          }}
        >
          Kaleidorium
        </h1>
      </div>

      {/* Simple loading dots */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <div 
          style={{
            width: '12px',
            height: '12px',
            backgroundColor: 'white',
            borderRadius: '50%',
            animation: 'pulse 1.4s infinite ease-in-out'
          }}
        />
        <div 
          style={{
            width: '12px',
            height: '12px',
            backgroundColor: 'white',
            borderRadius: '50%',
            animation: 'pulse 1.4s infinite ease-in-out 0.2s'
          }}
        />
        <div 
          style={{
            width: '12px',
            height: '12px',
            backgroundColor: 'white',
            borderRadius: '50%',
            animation: 'pulse 1.4s infinite ease-in-out 0.4s'
          }}
        />
      </div>

      {/* Simple tagline */}
      <p 
        style={{
          color: 'white',
          fontSize: '10px',
          fontWeight: '300',
          letterSpacing: '2px',
          textAlign: 'center',
          margin: 0,
          textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
        }}
      >
        YOUR PERSONAL ART CURATOR
      </p>

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes pulse {
          0%, 80%, 100% {
            transform: scale(0.8);
            opacity: 0.5;
          }
          40% {
            transform: scale(1.2);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
} 