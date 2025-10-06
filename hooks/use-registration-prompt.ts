"use client"

import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface RegistrationPromptState {
  interactionCount: number
  hasShownPrompt: boolean
  shouldShowPrompt: boolean
}

export function useRegistrationPrompt() {
  const [state, setState] = useState<RegistrationPromptState>({
    interactionCount: 0,
    hasShownPrompt: false,
    shouldShowPrompt: false
  })
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  // Check if user is authenticated
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user || null)
        
        // Load interaction count from localStorage for non-authenticated users
        if (!session?.user) {
          const savedCount = localStorage.getItem('kaleidorium_interaction_count')
          const savedPromptShown = localStorage.getItem('kaleidorium_prompt_shown')
          
          const interactionCount = savedCount ? parseInt(savedCount, 10) : 0
          const hasShownPrompt = savedPromptShown === 'true'
          
          setState(prev => ({
            ...prev,
            interactionCount,
            hasShownPrompt,
            shouldShowPrompt: interactionCount >= 10 && !hasShownPrompt
          }))
        }
      } catch (error) {
        console.error('Error checking user:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkUser()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null)
      if (session?.user) {
        // Reset state for authenticated users
        setState({
          interactionCount: 0,
          hasShownPrompt: false,
          shouldShowPrompt: false
        })
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  // Track user interaction
  const trackInteraction = useCallback(() => {
    // Only track for non-authenticated users
    if (user || isLoading) return

    setState(prev => {
      const newCount = prev.interactionCount + 1
      const shouldShow = newCount >= 10 && !prev.hasShownPrompt
      
      // Save to localStorage
      localStorage.setItem('kaleidorium_interaction_count', newCount.toString())
      
      return {
        interactionCount: newCount,
        hasShownPrompt: prev.hasShownPrompt,
        shouldShowPrompt: shouldShow
      }
    })
  }, [user, isLoading])

  // Show registration prompt
  const showRegistrationPrompt = useCallback(() => {
    if (user || isLoading || state.hasShownPrompt) return

    toast({
      title: "Register to enhance your experience",
      description: "Register to save your preferences and get better artwork suggestions.",
      duration: 8000, // Show for 8 seconds
      action: (
        <button
          onClick={() => {
            // Navigate to register page
            window.location.href = '/register'
          }}
          className="bg-black text-white px-3 py-1 rounded text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          Register
        </button>
      ),
    })

    // Mark as shown
    setState(prev => ({
      ...prev,
      hasShownPrompt: true
    }))
    
    // Save to localStorage
    localStorage.setItem('kaleidorium_prompt_shown', 'true')
  }, [user, isLoading, state.hasShownPrompt, toast])

  // Auto-show prompt when conditions are met
  useEffect(() => {
    if (state.shouldShowPrompt && !state.hasShownPrompt) {
      showRegistrationPrompt()
    }
  }, [state.shouldShowPrompt, state.hasShownPrompt, showRegistrationPrompt])

  return {
    trackInteraction,
    showRegistrationPrompt,
    interactionCount: state.interactionCount,
    hasShownPrompt: state.hasShownPrompt,
    isLoading
  }
}
