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

    // Listen for the beforeinstallprompt event (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('beforeinstallprompt event fired!', e);
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      console.log('Deferred prompt set:', !!e);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Also check if prompt is already available (sometimes it fires before component mounts)
    // Wait a bit for the event to potentially fire
    const checkPrompt = setTimeout(() => {
      console.log('Checking for deferred prompt availability...');
      // The event listener above will set it if available
    }, 1000);

    // Only show prompt on mobile devices that aren't already installed
    if ((iOS || android) && !isInStandaloneMode) {
      // Check if user has already dismissed the prompt recently
      const dismissed = localStorage.getItem('pwa-prompt-dismissed')
      const dismissedTime = dismissed ? parseInt(dismissed) : 0
      const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
      
      if (!dismissed || dismissedTime < oneWeekAgo) {
        // Show prompt after a short delay to not interrupt registration
        // Wait a bit longer to ensure beforeinstallprompt has time to fire
        setTimeout(() => {
          console.log('Showing install prompt, deferredPrompt available:', !!deferredPrompt);
          setShowPrompt(true);
        }, 4000)
      }
    }

    return () => {
      clearTimeout(checkPrompt);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    console.log('Install button clicked', { 
      deferredPrompt: !!deferredPrompt, 
      isAndroid, 
      isIOS,
      userAgent: navigator.userAgent 
    });
    
    if (deferredPrompt) {
      try {
        // Show the install prompt (works on Android Chrome, Edge, etc.)
        console.log('Calling deferredPrompt.prompt()...');
        await deferredPrompt.prompt();
        console.log('Prompt shown, waiting for user choice...');
        const { outcome } = await deferredPrompt.userChoice;
        
        console.log('Install prompt outcome:', outcome);
        
        if (outcome === 'accepted') {
          console.log('User accepted the install prompt');
          // The browser will handle the installation
        } else {
          console.log('User dismissed the install prompt');
        }
        
        setDeferredPrompt(null);
        setShowPrompt(false);
      } catch (error: any) {
        console.error('Error during install:', error);
        console.error('Error details:', {
          message: error?.message,
          name: error?.name,
          stack: error?.stack
        });
        // Show user-friendly error message
        alert('Installation failed. Please try using your browser\'s menu to "Add to Home Screen".');
        setShowPrompt(false);
      }
    } else if (isIOS) {
      // iOS - show instructions
      console.log('Showing iOS install instructions');
      setShowPrompt(false);
      // iOS instructions will be shown via the prompt itself
    } else {
      console.log('No install prompt available');
      // Show manual instructions for other browsers
      alert('To install this app:\n\n1. Tap the menu button (three dots)\n2. Select "Add to Home Screen" or "Install App"\n3. Follow the prompts');
      setShowPrompt(false);
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString())
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
                src="/logos/logo-mobile-20x20.svg"
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
            {deferredPrompt ? (
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
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-gray-600">
                  To install manually: Tap your browser menu (⋮) and select "Add to Home Screen" or "Install App"
                </p>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="font-semibold">Chrome:</span>
                    <span>Menu → "Add to Home Screen"</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="font-semibold">Safari:</span>
                    <span>Share → "Add to Home Screen"</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="font-semibold">Firefox:</span>
                    <span>Menu → "Install"</span>
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
            )}
          </div>
        )}
      </div>
    </div>
  )
} 
} 