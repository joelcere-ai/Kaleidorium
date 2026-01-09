"use client"

import { useState, useEffect } from 'react'
import { X, Download, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PWAInstallPromptProps {
  show: boolean
  onDismiss: () => void
}

export function PWAInstallPrompt({ show, onDismiss }: PWAInstallPromptProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(iOS)

    // Listen for beforeinstallprompt event (Android/Chrome)
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  useEffect(() => {
    if (show) {
      // Delay showing the prompt for better UX (after welcome back overlay)
      const timer = setTimeout(() => {
        setIsVisible(true)
        setIsAnimating(true)
      }, 2000)
      
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

  const handleInstall = async () => {
    if (deferredPrompt) {
      // Android/Chrome installation
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        console.log('PWA installation accepted')
      }
      
      setDeferredPrompt(null)
      handleDismiss()
    } else if (isIOS) {
      // iOS - show instructions
      setIsAnimating(false)
      setTimeout(() => {
        setIsVisible(false)
        showIOSInstructions()
      }, 300)
    }
  }

  const showIOSInstructions = () => {
    // Create iOS instruction overlay
    const instructionOverlay = document.createElement('div')
    instructionOverlay.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm z-[10000] flex items-center justify-center p-4'
    instructionOverlay.innerHTML = `
      <div class="bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 p-6 text-center">
        <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </div>
        <h3 class="text-lg font-bold text-black mb-2">Install Kaleidorium</h3>
        <p class="text-sm text-gray-600 mb-4">
          1. Tap the Share button <svg class="inline w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/></svg><br>
          2. Select "Add to Home Screen"<br>
          3. Tap "Add" to install
        </p>
        <button onclick="this.parentElement.parentElement.remove(); arguments[0].stopPropagation()" 
                class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl transition-colors">
          Got it!
        </button>
      </div>
    `
    
    document.body.appendChild(instructionOverlay)
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (document.body.contains(instructionOverlay)) {
        document.body.removeChild(instructionOverlay)
      }
    }, 10000)
    
    onDismiss()
  }

  if (!isVisible) return null

  return (
    <div className={`fixed bottom-4 left-4 right-4 z-[9998] transition-all duration-300 ${
      isAnimating ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
    }`}>
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 mx-auto max-w-sm">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDismiss}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 w-12 h-12"
        >
          <X className="w-8 h-8" />
          <span className="sr-only">Dismiss</span>
        </Button>
        
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center flex-shrink-0">
            <img
              src="/logos/logo-mobile-20x20-v3.jpg"
              alt="Kaleidorium Logo"
              className="w-6 h-6"
            />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-black text-sm">Install Kaleidorium</h3>
            <p className="text-xs text-gray-600">Quick access from your home screen</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDismiss}
            className="flex-1 text-xs"
          >
            Not now
          </Button>
          <Button
            onClick={handleInstall}
            size="sm"
            className="flex-1 bg-black hover:bg-gray-800 text-white text-xs"
          >
            <Download className="w-3 h-3 mr-1" />
            Install
          </Button>
        </div>
      </div>
    </div>
  )
}
