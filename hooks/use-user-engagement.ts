"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface UserEngagementData {
  lastVisit: string | null
  newArtworkCount: number
  totalArtworkCount: number
  showWelcomeBack: boolean
  isPWAInstalled: boolean
  showInstallPrompt: boolean
}

export function useUserEngagement() {
  const [engagementData, setEngagementData] = useState<UserEngagementData>({
    lastVisit: null,
    newArtworkCount: 0,
    totalArtworkCount: 0,
    showWelcomeBack: false,
    isPWAInstalled: false,
    showInstallPrompt: false
  })
  
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Check if PWA is installed
  const checkPWAInstallation = () => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    const isInWebAppiOS = (window.navigator as any).standalone === true
    const isAndroidPWA = document.referrer.includes('android-app://')
    
    return isStandalone || isInWebAppiOS || isAndroidPWA
  }

  // Check if device is mobile
  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           window.innerWidth < 768
  }

  // Get artwork count from database
  const getArtworkCount = async () => {
    try {
      const { count, error } = await supabase
        .from('Artwork')
        .select('*', { count: 'exact', head: true })
      
      if (error) throw error
      return count || 0
    } catch (error) {
      console.error('Error getting artwork count:', error)
      return 0
    }
  }

  // Get new artwork count since last visit
  const getNewArtworkCount = async (lastVisitDate: string) => {
    try {
      const { count, error } = await supabase
        .from('Artwork')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', lastVisitDate)
      
      if (error) throw error
      return count || 0
    } catch (error) {
      console.error('Error getting new artwork count:', error)
      return 0
    }
  }

  // Update last visit timestamp
  const updateLastVisit = async (userId: string) => {
    try {
      const now = new Date().toISOString()
      
      const { error } = await supabase
        .from('Collectors')
        .update({ last_interaction: now })
        .eq('user_id', userId)
      
      if (error) throw error
      
      // Also store in localStorage for quick access
      localStorage.setItem('kaleidorium_last_visit', now)
    } catch (error) {
      console.error('Error updating last visit:', error)
    }
  }

  // Get last visit from database or localStorage
  const getLastVisit = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('Collectors')
        .select('last_interaction')
        .eq('user_id', userId)
        .single()
      
      if (error) throw error
      
      return data?.last_interaction || localStorage.getItem('kaleidorium_last_visit')
    } catch (error) {
      console.error('Error getting last visit:', error)
      return localStorage.getItem('kaleidorium_last_visit')
    }
  }

  // Initialize engagement data
  const initializeEngagement = async () => {
    try {
      setLoading(true)
      
      // Get current user
      const { data: { session } } = await supabase.auth.getSession()
      const currentUser = session?.user
      setUser(currentUser)
      
      // Get total artwork count
      const totalCount = await getArtworkCount()
      
      let lastVisit = null
      let newCount = 0
      let showWelcome = false
      
      if (currentUser) {
        // Get last visit for authenticated users
        lastVisit = await getLastVisit(currentUser.id)
        
        if (lastVisit) {
          // Calculate new artwork since last visit
          newCount = await getNewArtworkCount(lastVisit)
          showWelcome = newCount > 0
        }
        
        // Update last visit timestamp
        await updateLastVisit(currentUser.id)
      } else {
        // For anonymous users, check localStorage
        const anonymousLastVisit = localStorage.getItem('kaleidorium_anonymous_last_visit')
        if (anonymousLastVisit) {
          lastVisit = anonymousLastVisit
          newCount = await getNewArtworkCount(anonymousLastVisit)
          showWelcome = newCount > 0
        }
        
        // Update anonymous last visit
        localStorage.setItem('kaleidorium_anonymous_last_visit', new Date().toISOString())
      }
      
      // Check PWA installation status
      const isPWAInstalled = checkPWAInstallation()
      const isMobile = isMobileDevice()
      const showInstallPrompt = isMobile && !isPWAInstalled && !localStorage.getItem('kaleidorium_install_dismissed')
      
      setEngagementData({
        lastVisit,
        newArtworkCount: newCount,
        totalArtworkCount: totalCount,
        showWelcomeBack: showWelcome,
        isPWAInstalled,
        showInstallPrompt
      })
      
    } catch (error) {
      console.error('Error initializing engagement:', error)
    } finally {
      setLoading(false)
    }
  }

  // Dismiss welcome back message
  const dismissWelcomeBack = () => {
    setEngagementData(prev => ({ ...prev, showWelcomeBack: false }))
  }

  // Dismiss install prompt
  const dismissInstallPrompt = () => {
    localStorage.setItem('kaleidorium_install_dismissed', 'true')
    setEngagementData(prev => ({ ...prev, showInstallPrompt: false }))
  }

  // Update app badge (for PWA)
  const updateAppBadge = (count: number) => {
    if ('setAppBadge' in navigator) {
      if (count > 0) {
        (navigator as any).setAppBadge(count)
      } else {
        (navigator as any).clearAppBadge()
      }
    }
  }

  useEffect(() => {
    initializeEngagement()
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      initializeEngagement()
    })
    
    return () => subscription.unsubscribe()
  }, [])

  // Update app badge when new artwork count changes
  useEffect(() => {
    if (engagementData.isPWAInstalled && engagementData.newArtworkCount > 0) {
      updateAppBadge(engagementData.newArtworkCount)
    }
  }, [engagementData.newArtworkCount, engagementData.isPWAInstalled])

  return {
    ...engagementData,
    user,
    loading,
    dismissWelcomeBack,
    dismissInstallPrompt,
    updateAppBadge,
    refresh: initializeEngagement
  }
}
