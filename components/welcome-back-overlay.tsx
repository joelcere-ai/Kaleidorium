"use client"

import { useState, useEffect } from 'react'
import { X, Sparkles } from 'lucide-react'
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
      <div className={`bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 ${
        isAnimating ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
      }`}>
        {/* Header */}
        <div className="relative p-6 pb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </Button>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-serif font-bold text-black">Welcome back!</h2>
              <p className="text-sm text-gray-600">Fresh art awaits you</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 mb-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-1">
                {newArtworkCount}
              </div>
              <p className="text-sm font-medium text-gray-700">
                new artwork{newArtworkCount !== 1 ? 's' : ''} added since your last visit
              </p>
            </div>
          </div>
          
          <p className="text-center text-gray-600 text-sm mb-6">
            Discover fresh pieces curated just for your taste. Happy exploring! ✨
          </p>
          
          <Button
            onClick={handleDismiss}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium py-3 rounded-xl transition-all duration-200"
          >
            Start Discovering
          </Button>
        </div>
      </div>
    </div>
  )
}
