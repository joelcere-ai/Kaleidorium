"use client"

import { useState, useEffect } from "react"
import { X, Download } from "lucide-react"
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

    // Store the deferred prompt locally so we can access it even if component re-renders
    let capturedPrompt: BeforeInstallPromptEvent | null = null;

    // Listen for the beforeinstallprompt event (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('beforeinstallprompt event fired!', e);
      e.preventDefault()
      capturedPrompt = e as BeforeInstallPromptEvent
      setDeferredPrompt(capturedPrompt)
      console.log('Deferred prompt captured and set');
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Only show prompt on mobile devices that aren't already installed
    if ((iOS || android) && !isInStandaloneMode) {
      // Check if user has already dismissed the prompt recently
      const dismissed = localStorage.getItem('pwa-prompt-dismissed')
      const dismissedTime = dismissed ? parseInt(dismissed) : 0
      const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
      
      if (!dismissed || dismissedTime < oneWeekAgo) {
        // Show prompt after a delay to ensure beforeinstallprompt has time to fire
        setTimeout(() => {
          // Check if we have a prompt (it might have been captured)
          if (capturedPrompt) {
            setDeferredPrompt(capturedPrompt);
          }
          setShowPrompt(true);
        }, 3000)
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    console.log('Add Shortcut button clicked', { 
      deferredPrompt: !!deferredPrompt, 
      isAndroid, 
      isIOS
    });
    
    if (deferredPrompt) {
      try {
        // Automatically trigger the install prompt
        console.log('Triggering install prompt automatically...');
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        console.log('Install prompt outcome:', outcome);
        
        if (outcome === 'accepted') {
          console.log('User accepted - installation will proceed');
        } else {
          console.log('User dismissed the install prompt');
        }
        
        setDeferredPrompt(null);
        setShowPrompt(false);
        // Signal that install prompt was interacted with
        localStorage.setItem('pwa-prompt-interacted', 'true')
        window.dispatchEvent(new CustomEvent('pwa-prompt-dismissed'))
      } catch (error: any) {
        console.error('Error during install:', error);
        // If automatic install fails, just dismiss the prompt
        setShowPrompt(false);
      }
    } else {
      // If no prompt available, just dismiss
      console.log('No install prompt available');
      setShowPrompt(false);
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString())
    // Signal that install prompt was dismissed so gesture intro can show
    localStorage.setItem('pwa-prompt-interacted', 'true')
    // Dispatch custom event for immediate communication
    window.dispatchEvent(new CustomEvent('pwa-prompt-dismissed'))
  }

  if (!showPrompt || isStandalone) {
    return null
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-4"
      onClick={handleDismiss}
    >
      <div
        className="bg-white rounded-t-2xl w-full max-w-md p-6 animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white border-2 border-black rounded-lg flex items-center justify-center">
              <img
                src="/logos/logo-desktop-32x32.svg"
                alt="Kaleidorium Logo"
                className="w-8 h-8"
              />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Add Kaleidorium to Home Screen</h3>
              <p className="text-sm text-gray-600">Quick access to discover art</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            className="h-12 w-12"
          >
            <X className="h-8 w-8" />
            <span className="sr-only">Dismiss</span>
          </Button>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            Add Kaleidorium to your home screen for quick and easy access.
          </p>
          <div className="space-y-3">
            <Button 
              onClick={handleInstallClick}
              className="w-full bg-black text-white hover:bg-gray-800"
              disabled={!deferredPrompt}
            >
              <Download className="h-4 w-4 mr-2" />
              Add Shortcut
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
      </div>
    </div>
  )
} 