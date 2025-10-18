"use client"

import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'

interface RegistrationPromptState {
  interactionCount: number
  hasShownPrompt: boolean
  shouldShowPrompt: boolean
  hasShownCollectionPrompt: boolean
}

export function useRegistrationPrompt(collection?: any[]) {
  const [state, setState] = useState<RegistrationPromptState>({
    interactionCount: 0,
    hasShownPrompt: false,
    shouldShowPrompt: false,
    hasShownCollectionPrompt: false
  })
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  // Using shared Supabase client from lib/supabase.ts

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
          const savedCollectionPromptShown = localStorage.getItem('kaleidorium_collection_prompt_shown')
          
          const interactionCount = savedCount ? parseInt(savedCount, 10) : 0
          const hasShownPrompt = savedPromptShown === 'true'
          const hasShownCollectionPrompt = savedCollectionPromptShown === 'true'
          
          setState(prev => ({
            ...prev,
            interactionCount,
            hasShownPrompt,
            hasShownCollectionPrompt,
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

    // Auth state changes are handled by parent component (page.tsx)
    // No need for duplicate auth listeners here
  }, [supabase])

  // Track user interaction
  const trackInteraction = useCallback(() => {
    // Only track for non-authenticated users
    if (user || isLoading) {
      console.log('trackInteraction skipped:', { user: !!user, isLoading })
      return
    }

    setState(prev => {
      const newCount = prev.interactionCount + 1
      const shouldShow = newCount >= 10 && !prev.hasShownPrompt
      
      console.log('trackInteraction:', { 
        newCount, 
        shouldShow, 
        hasShownPrompt: prev.hasShownPrompt,
        prevCount: prev.interactionCount
      })
      
      // Save to localStorage
      localStorage.setItem('kaleidorium_interaction_count', newCount.toString())
      
      return {
        interactionCount: newCount,
        hasShownPrompt: prev.hasShownPrompt,
        hasShownCollectionPrompt: prev.hasShownCollectionPrompt,
        shouldShowPrompt: shouldShow
      }
    })
  }, [user, isLoading])

  // Show registration prompt for interactions
  const showRegistrationPrompt = useCallback(() => {
    if (user || isLoading || state.hasShownPrompt) return

    toast({
      title: "Register to enhance your experience",
      description: "Register to save your preferences and get better artwork suggestions.",
      duration: 8000, // Show for 8 seconds
    })

    // Mark as shown
    setState(prev => ({
      ...prev,
      hasShownPrompt: true
    }))
    
    // Save to localStorage
    localStorage.setItem('kaleidorium_prompt_shown', 'true')
  }, [user, isLoading, state.hasShownPrompt, toast])

  // Show registration prompt for collection
  const showCollectionPrompt = useCallback(() => {
    if (user || isLoading || state.hasShownCollectionPrompt) return

    toast({
      title: "Save your collection",
      description: "Register to save your collection and never lose your favorite artworks.",
      duration: 8000, // Show for 8 seconds
    })

    // Mark as shown
    setState(prev => ({
      ...prev,
      hasShownCollectionPrompt: true
    }))
    
    // Save to localStorage
    localStorage.setItem('kaleidorium_collection_prompt_shown', 'true')
  }, [user, isLoading, state.hasShownCollectionPrompt, toast])

  // Auto-show prompt when conditions are met for interactions
  useEffect(() => {
    if (state.shouldShowPrompt && !state.hasShownPrompt) {
      console.log('Registration prompt conditions met:', { 
        shouldShowPrompt: state.shouldShowPrompt, 
        hasShownPrompt: state.hasShownPrompt,
        interactionCount: state.interactionCount 
      })
      showRegistrationPrompt()
    }
  }, [state.shouldShowPrompt, state.hasShownPrompt, showRegistrationPrompt])

  // Auto-show prompt when user has collection but isn't registered
  useEffect(() => {
    if (!user && !isLoading && collection && collection.length > 0 && !state.hasShownCollectionPrompt) {
      console.log('Collection prompt conditions met:', { 
        user, 
        isLoading, 
        collectionLength: collection.length, 
        hasShownCollectionPrompt: state.hasShownCollectionPrompt 
      })
      showCollectionPrompt()
    }
  }, [user, isLoading, collection, state.hasShownCollectionPrompt, showCollectionPrompt])

  // Update shouldShowPrompt when trackInteraction updates state
  useEffect(() => {
    setState(prev => ({
      ...prev,
      shouldShowPrompt: prev.interactionCount >= 10 && !prev.hasShownPrompt
    }))
  }, [state.interactionCount, state.hasShownPrompt])

  return {
    trackInteraction,
    showRegistrationPrompt,
    showCollectionPrompt,
    interactionCount: state.interactionCount,
    hasShownPrompt: state.hasShownPrompt,
    isLoading
  }
}
