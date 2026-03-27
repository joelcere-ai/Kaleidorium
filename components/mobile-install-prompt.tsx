"use client"

import { useState, useEffect, useRef } from "react"
import { X, Download, CheckCircle } from "lucide-react"
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
  else if (/EdgA|EdgGA/.test(ua)) browser = "edge"
  else if (/OPR|OPiOS/.test(ua)) browser = "opera"
  else if (/FxiOS|Firefox/.test(ua)) browser = "firefox"
  else if (/CriOS|Chrome/.test(ua)) browser = "chrome"
  else if (/Safari/.test(ua)) browser = "safari"

  return { browser, isIOS, isAndroid }
}

// ─── Post-install "where is it?" guidance ────────────────────────────────────
function PostInstallGuidance({ browser }: { browser: BrowserName }) {
  if (browser === "samsung") {
    return (
      <ol className="text-sm text-gray-700 space-y-2 mb-4">
        <li className="flex gap-2 items-start">
          <span className="font-bold text-black shrink-0">1.</span>
          <span>Swipe <strong>up from your home screen</strong> to open your app drawer</span>
        </li>
        <li className="flex gap-2 items-start">
          <span className="font-bold text-black shrink-0">2.</span>
          <span>Look for the <strong>Kaleidorium</strong> icon</span>
        </li>
        <li className="flex gap-2 items-start">
          <span className="font-bold text-black shrink-0">3.</span>
          <span>Long-press the icon and tap <strong>"Add to Home screen"</strong> to pin it</span>
        </li>
      </ol>
    )
  }
  // Default Chrome Android
  return (
    <ol className="text-sm text-gray-700 space-y-2 mb-4">
      <li className="flex gap-2 items-start">
        <span className="font-bold text-black shrink-0">1.</span>
        <span>Swipe up from your home screen to open your <strong>app drawer</strong></span>
      </li>
      <li className="flex gap-2 items-start">
        <span className="font-bold text-black shrink-0">2.</span>
        <span>Look for the <strong>Kaleidorium</strong> icon — it may take a few seconds to appear</span>
      </li>
      <li className="flex gap-2 items-start">
        <span className="font-bold text-black shrink-0">3.</span>
        <span>Long-press it and drag to your home screen if you'd like quick access</span>
      </li>
    </ol>
  )
}

// ─── Per-browser manual install instructions ─────────────────────────────────
function BrowserInstructions({ browser, isIOS }: { browser: BrowserName; isIOS: boolean }) {
  type Step = { text: React.ReactNode }
  let steps: Step[] = []
  let note: string | null = null

  if (isIOS) {
    if (browser === "chrome" || browser === "opera") {
      steps = [
        { text: <>Tap the <strong>Share</strong> button <span className="inline-block bg-gray-100 px-1 rounded text-xs">⎋</span> at the bottom of the screen</> },
        { text: <>Scroll down and tap <strong>"Add to Home Screen"</strong></> },
        { text: <>Tap <strong>"Add"</strong> in the top-right corner</> },
      ]
      note = "For the best experience on iOS, use Safari."
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
      note = "The Kaleidorium icon will appear in your app drawer."
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

// ─── Shared modal shell ───────────────────────────────────────────────────────
function ModalShell({
  onClose,
  title,
  children,
}: {
  onClose: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <div
      className="fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center p-4"
      onClick={onClose}
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
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
        <h3 className="font-bold text-lg text-black mb-1">{title}</h3>
        {children}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export function MobileInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [browserInfo, setBrowserInfo] = useState<ReturnType<typeof detectBrowser> | null>(null)
  const [view, setView] = useState<"banner" | "manual" | "post-install">("banner")
  const promptRef = useRef<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    const info = detectBrowser()
    setBrowserInfo(info)
    const { isIOS, isAndroid } = info

    const standalone =
      (window.navigator as any).standalone === true ||
      window.matchMedia("(display-mode: standalone)").matches
    if (standalone) return

    const interacted = localStorage.getItem("pwa-prompt-interacted")
    const dismissed = localStorage.getItem("pwa-prompt-dismissed")
    const dismissedTime = dismissed ? parseInt(dismissed) : 0
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    if (interacted || (dismissed && dismissedTime > oneWeekAgo)) return

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      const prompt = e as unknown as BeforeInstallPromptEvent
      promptRef.current = prompt
      setDeferredPrompt(prompt)
    }
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    // appinstalled fires on Android after Chrome finishes — switch to post-install guidance
    const handleAppInstalled = () => {
      setView("post-install")
      setShowPrompt(true)
      localStorage.setItem("pwa-prompt-interacted", "true")
      window.dispatchEvent(new CustomEvent("pwa-prompt-dismissed"))
    }
    window.addEventListener("appinstalled", handleAppInstalled)

    if (isIOS || isAndroid) {
      setTimeout(() => {
        if (promptRef.current) setDeferredPrompt(promptRef.current)
        setShowPrompt(true)
      }, 3000)
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
  }, [])

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem("pwa-prompt-dismissed", Date.now().toString())
    localStorage.setItem("pwa-prompt-interacted", "true")
    window.dispatchEvent(new CustomEvent("pwa-prompt-dismissed"))
  }

  const handleInstallClick = async () => {
    const prompt = deferredPrompt || promptRef.current

    // iOS — always show manual Share-sheet instructions
    if (browserInfo?.isIOS) {
      setView("manual")
      return
    }

    if (prompt) {
      try {
        await prompt.prompt()
        const { outcome } = await prompt.userChoice
        setDeferredPrompt(null)
        promptRef.current = null

        if (outcome === "accepted") {
          // Show "where is it?" guidance immediately — don't wait for appinstalled
          setView("post-install")
          localStorage.setItem("pwa-prompt-interacted", "true")
          window.dispatchEvent(new CustomEvent("pwa-prompt-dismissed"))
        } else {
          // User dismissed Chrome's dialog — show manual route
          setView("manual")
        }
      } catch {
        // Prompt already used or failed — fall back to manual
        setView("manual")
        setDeferredPrompt(null)
        promptRef.current = null
      }
    } else {
      // beforeinstallprompt never fired — manual route
      setView("manual")
    }
  }

  if (!showPrompt) return null

  // ── Post-install: where to find the app ──
  if (view === "post-install") {
    return (
      <ModalShell onClose={handleDismiss} title="Installation started!">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
          <p className="text-sm text-gray-600">
            Kaleidorium is being added to your device. Here&apos;s where to find it:
          </p>
        </div>
        <PostInstallGuidance browser={browserInfo?.browser ?? "chrome"} />
        <Button
          onClick={handleDismiss}
          variant="outline"
          className="w-full"
        >
          Got it
        </Button>
      </ModalShell>
    )
  }

  // ── Manual instructions (Chrome menu / iOS Share sheet) ──
  if (view === "manual") {
    return (
      <ModalShell onClose={handleDismiss} title="Install Kaleidorium">
        <BrowserInstructions
          browser={browserInfo?.browser ?? "chrome"}
          isIOS={browserInfo?.isIOS ?? false}
        />
        <Button onClick={handleDismiss} variant="outline" className="w-full">
          Got it
        </Button>
      </ModalShell>
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
            variant="outline"
            className="w-full"
          >
            <Download className="h-4 w-4 mr-2" />
            {deferredPrompt || promptRef.current ? "Install App" : "Show me how"}
          </Button>
          <Button onClick={handleDismiss} variant="ghost" className="w-full text-gray-500 text-sm">
            Maybe later
          </Button>
        </div>
      </div>
    </div>
  )
}
