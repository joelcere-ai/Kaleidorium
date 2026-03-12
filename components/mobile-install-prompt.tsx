"use client"

import { useState, useEffect, useRef } from "react"
import { X, Download } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
  prompt(): Promise<void>
}

type BrowserName = "chrome" | "samsung" | "firefox" | "edge" | "opera" | "safari" | "other"

function detectBrowser(): { browser: BrowserName; isIOS: boolean; isAndroid: boolean } {
  const ua = navigator.userAgent
  const isIOS = /iPad|iPhone|iPod/.test(ua)
  const isAndroid = /Android/.test(ua)

  let browser: BrowserName = "other"
  if (/SamsungBrowser/.test(ua)) browser = "samsung"
  else if (/EdgA|EdgGA/.test(ua)) browser = "edge"          // Edge on Android/iOS
  else if (/OPR|OPiOS/.test(ua)) browser = "opera"          // Opera
  else if (/FxiOS|Firefox/.test(ua)) browser = "firefox"    // Firefox iOS or Android
  else if (/CriOS|Chrome/.test(ua)) browser = "chrome"      // Chrome iOS or Android
  else if (/Safari/.test(ua)) browser = "safari"            // Safari iOS

  return { browser, isIOS, isAndroid }
}

// ─── Per-browser step-by-step instructions ──────────────────────────────────
function BrowserInstructions({ browser, isIOS }: { browser: BrowserName; isIOS: boolean }) {
  type Step = { text: React.ReactNode }
  let steps: Step[] = []
  let note: string | null = null

  if (isIOS) {
    if (browser === "chrome" || browser === "opera") {
      // Chrome / Opera on iOS use the native share sheet too, but accessed differently
      steps = [
        { text: <>Tap the <strong>Share</strong> button <span className="inline-block bg-gray-100 px-1 rounded text-xs">⎋</span> at the bottom of the screen</> },
        { text: <>Scroll down and tap <strong>"Add to Home Screen"</strong></> },
        { text: <>Tap <strong>"Add"</strong> in the top-right corner</> },
      ]
      note = "Make sure you're using Safari for the best experience on iOS."
    } else if (browser === "firefox") {
      steps = [
        { text: <>Tap the <strong>three-dot menu</strong> <span className="inline-block bg-gray-100 px-1 rounded font-mono text-xs">⋯</span> at the bottom</> },
        { text: <>Tap <strong>"Share"</strong>, then <strong>"Add to Home Screen"</strong></> },
        { text: <>Tap <strong>"Add"</strong> to confirm</> },
      ]
    } else {
      // Safari (default iOS)
      steps = [
        { text: <>Tap the <strong>Share</strong> button <span className="inline-block bg-gray-100 px-1 rounded text-xs">⎋</span> at the bottom of Safari</> },
        { text: <>Scroll down and tap <strong>"Add to Home Screen"</strong></> },
        { text: <>Tap <strong>"Add"</strong> in the top-right corner</> },
      ]
    }
  } else {
    // Android
    if (browser === "samsung") {
      steps = [
        { text: <>Tap the <strong>three-line menu</strong> <span className="inline-block bg-gray-100 px-1 rounded font-mono text-xs">☰</span> at the bottom of the screen</> },
        { text: <>Tap <strong>"Add page to"</strong>, then <strong>"Home screen"</strong></> },
        { text: <>Tap <strong>"Add"</strong> to confirm</> },
      ]
    } else if (browser === "firefox") {
      steps = [
        { text: <>Tap the <strong>three-dot menu</strong> <span className="inline-block bg-gray-100 px-1 rounded font-mono text-xs">⋮</span> at the top right</> },
        { text: <>Tap <strong>"Install"</strong> or <strong>"Add to Home Screen"</strong></> },
        { text: <>Tap <strong>"Add"</strong> to confirm</> },
      ]
    } else if (browser === "edge") {
      steps = [
        { text: <>Tap the <strong>three-dot menu</strong> <span className="inline-block bg-gray-100 px-1 rounded font-mono text-xs">⋯</span> at the bottom</> },
        { text: <>Tap <strong>"Add to phone"</strong>, then <strong>"Add to Home screen"</strong></> },
        { text: <>Tap <strong>"Add"</strong> to confirm</> },
      ]
    } else if (browser === "opera") {
      steps = [
        { text: <>Tap the <strong>Opera menu</strong> (O icon) at the bottom</> },
        { text: <>Tap <strong>"Home screen"</strong></> },
        { text: <>Tap <strong>"Add"</strong> to confirm</> },
      ]
    } else {
      // Chrome (default Android)
      steps = [
        { text: <>Tap the <strong>three-dot menu</strong> <span className="inline-block bg-gray-100 px-1 rounded font-mono text-xs">⋮</span> in the top-right corner of Chrome</> },
        { text: <>Tap <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong></> },
        { text: <>Tap <strong>"Add"</strong> or <strong>"Install"</strong> to confirm</> },
      ]
      note = "The Kaleidorium icon will appear on your home screen and in your app drawer."
    }
  }

  return (
    <>
      <ol className="text-sm text-gray-700 space-y-2 mb-4">
        {steps.map((s, i) => (
          <li key={i} className="flex gap-2 items-start">
            <span className="font-bold text-black shrink-0">{i + 1}.</span>
            <span>{s.text}</span>
          </li>
        ))}
      </ol>
      {note && <p className="text-xs text-gray-500 mb-4">{note}</p>}
    </>
  )
}

export function MobileInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [browserInfo, setBrowserInfo] = useState<ReturnType<typeof detectBrowser> | null>(null)
  const [installed, setInstalled] = useState(false)
  const [showManualInstructions, setShowManualInstructions] = useState(false)
  const promptRef = useRef<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    const info = detectBrowser()
    setBrowserInfo(info)
    const { isIOS, isAndroid } = info
    const standalone =
      (window.navigator as any).standalone === true ||
      window.matchMedia("(display-mode: standalone)").matches

    // Already running as installed PWA — never show
    if (standalone) return

    // Already interacted or dismissed recently — respect that
    const interacted = localStorage.getItem("pwa-prompt-interacted")
    const dismissed = localStorage.getItem("pwa-prompt-dismissed")
    const dismissedTime = dismissed ? parseInt(dismissed) : 0
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    if (interacted || (dismissed && dismissedTime > oneWeekAgo)) return

    // Listen for Chrome's native install event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      const prompt = e as unknown as BeforeInstallPromptEvent
      promptRef.current = prompt
      setDeferredPrompt(prompt)
    }
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    // Listen for successful installation
    const handleAppInstalled = () => {
      setInstalled(true)
      setShowPrompt(false)
      setShowManualInstructions(false)
      localStorage.setItem("pwa-prompt-interacted", "true")
      window.dispatchEvent(new CustomEvent("pwa-prompt-dismissed"))
    }
    window.addEventListener("appinstalled", handleAppInstalled)

    // Show prompt after 3 s for mobile only
    if (isIOS || isAndroid) {
      setTimeout(() => {
        // Use ref so we always have the latest captured prompt
        if (promptRef.current) {
          setDeferredPrompt(promptRef.current)
        }
        setShowPrompt(true)
      }, 3000)
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    const prompt = deferredPrompt || promptRef.current

    if (browserInfo?.isIOS) {
      // iOS: always show manual Share-sheet instructions
      setShowManualInstructions(true)
      return
    }

    if (prompt) {
      // Android Chrome: trigger the native install dialog
      try {
        await prompt.prompt()
        const { outcome } = await prompt.userChoice
        if (outcome === "accepted") {
          // appinstalled event will fire and clean up
        } else {
          // User dismissed Chrome's dialog — offer manual route
          setShowManualInstructions(true)
        }
        setDeferredPrompt(null)
        promptRef.current = null
      } catch {
        // Prompt already used or failed — fall back to manual
        setShowManualInstructions(true)
        setDeferredPrompt(null)
        promptRef.current = null
      }
    } else {
      // beforeinstallprompt never fired or already consumed — manual route
      setShowManualInstructions(true)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    setShowManualInstructions(false)
    localStorage.setItem("pwa-prompt-dismissed", Date.now().toString())
    localStorage.setItem("pwa-prompt-interacted", "true")
    window.dispatchEvent(new CustomEvent("pwa-prompt-dismissed"))
  }

  if (!showPrompt || installed) return null

  // ── Manual instructions overlay (Android Chrome menu / iOS Share sheet) ──
  if (showManualInstructions) {
    return (
      <div
        className="fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center p-4"
        onClick={handleDismiss}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4">
            <img
              src="/logos/kaleidorium-icon-64.png"
              alt="Kaleidorium"
              className="w-12 h-12 rounded-xl"
            />
            <Button variant="ghost" size="icon" onClick={handleDismiss}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          <h3 className="font-bold text-lg text-black mb-1">Install Kaleidorium</h3>

          <BrowserInstructions browser={browserInfo?.browser ?? "chrome"} isIOS={browserInfo?.isIOS ?? false} />

          <Button onClick={handleDismiss} className="w-full bg-black text-white hover:bg-gray-800">
            Got it
          </Button>
        </div>
      </div>
    )
  }

  // ── Main install banner ──
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
            <img
              src="/logos/kaleidorium-icon-64.png"
              alt="Kaleidorium Logo"
              className="w-12 h-12 rounded-xl"
            />
            <div>
              <h3 className="font-semibold text-lg">Add to Home Screen</h3>
              <p className="text-sm text-gray-600">Quick access to discover art</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleDismiss} className="h-12 w-12">
            <X className="h-8 w-8" />
          </Button>
        </div>

        <div className="space-y-3">
          <Button
            onClick={handleInstallClick}
            className="w-full bg-black text-white hover:bg-gray-800"
          >
            <Download className="h-4 w-4 mr-2" />
            {deferredPrompt || promptRef.current ? "Install App" : "Show me how"}
          </Button>
          <Button onClick={handleDismiss} className="w-full" variant="outline">
            Maybe later
          </Button>
        </div>
      </div>
    </div>
  )
}
