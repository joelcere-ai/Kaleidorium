"use client"

import { useState, useEffect } from "react"
import { X, Plus, Share, Download } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export function MobileInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [isAndroid, setIsAndroid] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Check if device is iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isInStandaloneMode = (window.navigator as any).standalone === true || 
      window.matchMedia('(display-mode: standalone)').matches

    // Check if device is Android
    const android = /Android/.test(navigator.userAgent)
    
    setIsIOS(iOS)
    setIsAndroid(android)
    setIsStandalone(isInStandaloneMode)

    // Only show prompt on mobile devices that aren't already installed
    if ((iOS || android) && !isInStandaloneMode) {
      // Check if user has already dismissed the prompt recently
      const dismissed = localStorage.getItem('pwa-prompt-dismissed')
      const dismissedTime = dismissed ? parseInt(dismissed) : 0
      const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
      
      if (!dismissed || dismissedTime < oneWeekAgo) {
        // Show prompt after a short delay to not interrupt registration
        setTimeout(() => setShowPrompt(true), 3000)
      }
    }

    // Listen for the beforeinstallprompt event (Android)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (deferredPrompt && isAndroid) {
      // Android - use the deferred prompt
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt')
      }
      
      setDeferredPrompt(null)
      setShowPrompt(false)
    }
    // For iOS, the prompt shows instructions since we can't trigger it programmatically
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString())
  }

  if (!showPrompt || isStandalone) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-4">
      <div className="bg-white rounded-t-2xl w-full max-w-md p-6 animate-in slide-in-from-bottom duration-300">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-16 h-12 bg-black rounded-xl flex items-center justify-center px-2">
              <span className="text-white font-serif text-xs font-bold tracking-tight">Kaleidorium</span>
            </div>
            <div>
              <h3 className="font-semibold text-lg">Add Kaleidorium to Home Screen</h3>
              <p className="text-sm text-gray-600">Quick access to discover art</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {isIOS ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              Install this app on your home screen for quick and easy access when you're on the go.
            </p>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-sm">
                <Share className="h-5 w-5 text-blue-500" />
                <span>Tap the Share button in Safari</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <Plus className="h-5 w-5 text-blue-500" />
                <span>Then tap "Add to Home Screen"</span>
              </div>
            </div>
            <Button 
              onClick={handleDismiss}
              className="w-full"
              variant="outline"
            >
              Got it
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              Install Kaleidorium as an app for the best experience discovering and collecting art.
            </p>
            <div className="space-y-3">
              <Button 
                onClick={handleInstallClick}
                className="w-full bg-black text-white hover:bg-gray-800"
              >
                <Download className="h-4 w-4 mr-2" />
                Install App
              </Button>
              <Button 
                onClick={handleDismiss}
                className="w-full"
                variant="outline"
              >
                Maybe later
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 