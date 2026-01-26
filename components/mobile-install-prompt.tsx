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

    // Listen for the beforeinstallprompt event (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('beforeinstallprompt event fired!', e);
      e.preventDefault()
      const prompt = e as unknown as BeforeInstallPromptEvent;
      // Store globally first
      (window as any).__deferredPrompt = prompt;
      // Then update state
      setDeferredPrompt(prompt);
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
          // Check if we have a prompt in global scope
          if ((window as any).__deferredPrompt) {
            setDeferredPrompt((window as any).__deferredPrompt);
          }
          // Show prompt even if we don't have prompt yet (for iOS or if event fires later)
          setShowPrompt(true);
        }, 3000)
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const showIOSInstructions = () => {
    // Create iOS instruction overlay
    const instructionOverlay = document.createElement('div')
    instructionOverlay.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm z-[10000] flex items-center justify-center p-4'
    instructionOverlay.innerHTML = `
      <div class="bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 p-6 text-center">
        <div class="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/>
          </svg>
        </div>
        <h3 class="text-lg font-bold text-black mb-2">Add Kaleidorium to Home Screen</h3>
        <p class="text-sm text-gray-600 mb-4">
          <strong>Step 1:</strong> Tap the Share button <svg class="inline w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/></svg> at the bottom of your screen<br><br>
          <strong>Step 2:</strong> Scroll down and tap "Add to Home Screen"<br><br>
          <strong>Step 3:</strong> Tap "Add" in the top right corner
        </p>
        <button onclick="this.parentElement.parentElement.remove(); arguments[0].stopPropagation()" 
                class="w-full bg-black hover:bg-gray-800 text-white font-medium py-3 px-4 rounded-xl transition-colors">
          Got it!
        </button>
      </div>
    `
    
    // Handle click outside to close
    instructionOverlay.addEventListener('click', (e) => {
      if (e.target === instructionOverlay) {
        document.body.removeChild(instructionOverlay)
      }
    })
    
    document.body.appendChild(instructionOverlay)
    
    // Auto-remove after 15 seconds
    setTimeout(() => {
      if (document.body.contains(instructionOverlay)) {
        document.body.removeChild(instructionOverlay)
      }
    }, 15000)
  }

  const handleInstallClick = async () => {
    console.log('Add Shortcut button clicked', { 
      deferredPrompt: !!deferredPrompt, 
      isAndroid, 
      isIOS,
      userAgent: navigator.userAgent
    });
    
    // For iOS, show installation instructions (iOS doesn't support beforeinstallprompt)
    if (isIOS) {
      console.log('iOS detected - showing installation instructions');
      setShowPrompt(false);
      localStorage.setItem('pwa-prompt-interacted', 'true')
      window.dispatchEvent(new CustomEvent('pwa-prompt-dismissed'))
      // Show iOS instructions after a brief delay
      setTimeout(() => {
        showIOSInstructions();
      }, 300);
      return;
    }
    
    if (deferredPrompt) {
      try {
        // Automatically trigger the install prompt
        console.log('Triggering install prompt automatically...');
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        console.log('Install prompt outcome:', outcome);
        
        if (outcome === 'accepted') {
          console.log('User accepted - installation will proceed');
          // On some Android devices, the shortcut may not appear immediately
          // It might be in the app drawer or require a page refresh
          console.log('Note: If shortcut does not appear on home screen, check your app drawer or refresh the page');
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
        localStorage.setItem('pwa-prompt-interacted', 'true')
        window.dispatchEvent(new CustomEvent('pwa-prompt-dismissed'))
      }
    } else {
      // Check if prompt might be available in global scope (captured before component mounted)
      const globalPrompt = (window as any).__deferredPrompt;
      if (globalPrompt) {
        try {
          console.log('Using global deferred prompt');
          await globalPrompt.prompt();
          const { outcome } = await globalPrompt.userChoice;
          console.log('Install prompt outcome:', outcome);
          (window as any).__deferredPrompt = null;
          setShowPrompt(false);
          localStorage.setItem('pwa-prompt-interacted', 'true')
          window.dispatchEvent(new CustomEvent('pwa-prompt-dismissed'))
          return;
        } catch (error: any) {
          console.error('Error using global prompt:', error);
        }
      }
      
      // If no prompt available, just dismiss
      console.log('No install prompt available - dismissing');
      setShowPrompt(false);
      localStorage.setItem('pwa-prompt-interacted', 'true')
      window.dispatchEvent(new CustomEvent('pwa-prompt-dismissed'))
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
            <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center">
              <img
                src="/logos/app-logo-48x48-v4.jpg"
                alt="Kaleidorium Logo"
                className="w-10 h-10"
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
            Add Kaleidorium to your home screen for quick and easy access. After installation, check your home screen or app drawer for the Kaleidorium icon.
          </p>
          <div className="space-y-3">
            <Button 
              onClick={handleInstallClick}
              className="w-full bg-black text-white hover:bg-gray-800"
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