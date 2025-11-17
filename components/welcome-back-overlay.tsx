"use client"

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface WelcomeBackOverlayProps {
  show: boolean
  newArtworkCount: number
  onDismiss: () => void
}

export function WelcomeBackOverlay({ show, newArtworkCount, onDismiss }: WelcomeBackOverlayProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (show) {
      // Delay showing the overlay slightly for better UX
      const timer = setTimeout(() => {
        setIsVisible(true)
        setIsAnimating(true)
      }, 1000)
      
      return () => clearTimeout(timer)
    }
  }, [show])

  const handleDismiss = () => {
    setIsAnimating(false)
    setTimeout(() => {
      setIsVisible(false)
      onDismiss()
    }, 300)
  }

  // Auto-dismiss after 6 seconds
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        handleDismiss()
      }, 6000)
      
      return () => clearTimeout(timer)
    }
  }, [isVisible])

  if (!isVisible) return null

  return (
    <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 transition-all duration-300 ${
      isAnimating ? 'opacity-100' : 'opacity-0'
    }`}>
      <div className={`bg-white rounded-lg shadow-2xl max-w-sm w-full mx-4 transform transition-all duration-300 ${
        isAnimating ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
      }`}>
        {/* Header */}
        <div className="relative p-4 pb-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 w-12 h-12"
          >
            <X className="w-8 h-8" />
          </Button>
          
          <div className="text-center">
            <h2 className="text-lg font-serif font-bold text-black mb-1">Welcome back.</h2>
            <p className="text-sm text-gray-600">
              We've added <span className="font-semibold text-black">{newArtworkCount}</span> artwork{newArtworkCount !== 1 ? 's' : ''} since your last visit.
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 pb-4">
          <Button
            onClick={handleDismiss}
            className="w-full bg-black hover:bg-gray-800 text-white font-medium py-2 px-4 rounded-md transition-all duration-200"
            style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}
          >
            Start Discovering
          </Button>
        </div>
      </div>
    </div>
  )
}

