"use client"

import type React from "react"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { ArrowLeft, Heart, Plus, Trash, X, Check, Menu, Search, Palette, Mail, User, Info, ThumbsDown, ThumbsUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { useRouter } from "next/navigation"
import { initEmailJS, sendArtistSubmission } from "@/lib/emailjs"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { ArtworkDetails } from "@/components/artwork-details"
import { NewMobileHeader } from "@/components/new-mobile-header"
import { type FilterState } from "@/components/app-header"
import { useKeyboardShortcut } from "@/hooks/use-keyboard-shortcut"
import { ImageOverlay } from "@/components/image-overlay"
import { ProfilePage } from "@/components/profile-page"
import { WelcomeBackOverlay } from "@/components/welcome-back-overlay"
import { useUserEngagement } from "@/hooks/use-user-engagement"
import { useRegistrationPrompt } from "@/hooks/use-registration-prompt"
import { supabase } from "@/lib/supabase"
import type { Artwork } from "@/types/artwork"
import { v4 as uuidv4 } from 'uuid'
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip } from "@/components/ui/tooltip"
import { useViewContext } from "./ViewContext"
import { useMobileDetection } from "@/hooks/use-mobile-detection"
import MobileArtDiscovery from "./mobile-art-discovery"
import ProgressiveImage from "./progressive-image"
import CardStack from "./card-stack"
import { ArtistNameWithBadge } from "@/components/artist-name-with-badge"

interface AppHeaderProps {
  view: "discover" | "collection" | "profile" | "for-artists" | "about" | "contact" | "terms" | "privacy"
  setView: (view: "discover" | "collection" | "profile" | "for-artists" | "about" | "contact" | "terms" | "privacy") => void
  collectionCount: number
}

interface ArtDiscoveryProps {
  view: "discover" | "collection" | "profile" | "for-artists" | "about" | "contact" | "terms" | "privacy";
  setView: (view: "discover" | "collection" | "profile" | "for-artists" | "about" | "contact" | "terms" | "privacy") => void;
  collectionCount: number;
  setCollectionCount: (count: number) => void;
  selectedArtworkId?: string | null;
  onToggleDesktopFilters?: () => void;
}

export default function ArtDiscovery({ view, setView, collectionCount, setCollectionCount, selectedArtworkId, onToggleDesktopFilters }: ArtDiscoveryProps) {
  const { isMobile, isTablet, isLandscape, isPortrait, screenWidth, screenHeight } = useMobileDetection()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingError, setLoadingError] = useState<string | null>(null)
  const fetchingRef = useRef(false)
  const isUpdatingArtworksRef = useRef(false) // Prevent session restoration during updates
  const [artworks, setArtworks] = useState<Artwork[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [collection, setCollection] = useState<Artwork[]>([])
  const [user, setUser] = useState<{ id: string } | null>(null)
  const { toast } = useToast()
  const router = useRouter()
  
  // Registration prompt hook for non-authenticated users
  const { trackInteraction } = useRegistrationPrompt(collection)

  // 🚨 AGGRESSIVE DOM MANIPULATION FOR FONT CONSISTENCY
  useEffect(() => {
    if (view === "for-artists") {
      const aggressiveForceStyles = () => {
        // Target ALL elements in the for-artists view EXCEPT mobile header
        const allElements = document.querySelectorAll('[data-view="for-artists"] *')
        
        allElements.forEach((el: Element) => {
          const htmlEl = el as HTMLElement
          const tagName = htmlEl.tagName.toLowerCase()
          
          // Skip mobile header elements
          if (htmlEl.closest('.mobile-header')) {
            return;
          }
          
          // Force titles (h1, h2, h3) to 16px Times New Roman Bold
          if (tagName === 'h1' || tagName === 'h2' || tagName === 'h3') {
            htmlEl.style.fontSize = '16px !important'
            htmlEl.style.fontFamily = '"Times New Roman", Times, serif !important'
            htmlEl.style.fontWeight = 'bold !important'
            htmlEl.style.color = 'black !important'
            htmlEl.style.lineHeight = '1.2 !important'
          }
          
          // Force paragraphs and list items to 14px Arial
          else if (tagName === 'p' || tagName === 'li') {
            htmlEl.style.fontSize = '14px !important'
            htmlEl.style.fontFamily = 'Arial, sans-serif !important'
            htmlEl.style.color = 'black !important'
            htmlEl.style.fontWeight = 'normal !important'
            htmlEl.style.lineHeight = '1.4 !important'
          }
          
          // Force ul elements
          else if (tagName === 'ul') {
            htmlEl.style.fontSize = '14px !important'
            htmlEl.style.fontFamily = 'Arial, sans-serif !important'
            htmlEl.style.color = 'black !important'
          }
        })

        // Extra aggressive targeting for bullet points (excluding mobile header)
        const bulletPoints = document.querySelectorAll('[data-view="for-artists"] ul li')
        bulletPoints.forEach((el: Element) => {
          const htmlEl = el as HTMLElement
          
          // Skip mobile header elements
          if (htmlEl.closest('.mobile-header')) {
            return;
          }
          
          htmlEl.style.setProperty('font-size', '14px', 'important')
          htmlEl.style.setProperty('font-family', 'Arial, sans-serif', 'important')
          htmlEl.style.setProperty('color', 'black', 'important')
          htmlEl.style.setProperty('font-weight', 'normal', 'important')
          htmlEl.style.setProperty('line-height', '1.4', 'important')
        })

        console.log('🚨 AGGRESSIVE FORCE: All DOM elements styled for For Artists page')
      }

      // Apply multiple times with different delays
      aggressiveForceStyles()
      setTimeout(aggressiveForceStyles, 50)
      setTimeout(aggressiveForceStyles, 100)
      setTimeout(aggressiveForceStyles, 200)
      setTimeout(aggressiveForceStyles, 500)
      setTimeout(aggressiveForceStyles, 1000)
    }
  }, [view])
  
  
  // User engagement features
  const {
    showWelcomeBack,
    newArtworkCount,
    dismissWelcomeBack,
    loading: engagementLoading
  } = useUserEngagement()

  // State for image overlay
  const [overlayImage, setOverlayImage] = useState<{ url: string; alt: string } | null>(null)
  const [selectedCollectionArtwork, setSelectedCollectionArtwork] = useState<Artwork | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showMenuModal, setShowMenuModal] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    portfolioLink: "",
    message: ""
  })

  // Add local preferences state for anonymous users
  const [localPreferences, setLocalPreferences] = useState<{
    artists: Record<string, number>;
    genres: Record<string, number>;
    styles: Record<string, number>;
    subjects: Record<string, number>;
    colors: Record<string, number>;
    priceRanges: Record<string, number>;
    interactionCount: number;
    viewed_artworks: string[];
  }>({
    artists: {},
    genres: {},
    styles: {},
    subjects: {},
    colors: {},
    priceRanges: {},
    interactionCount: 0,
    viewed_artworks: []
  });

  // Add state for filtered artworks and active filters
  const [filteredArtworks, setFilteredArtworks] = useState<Artwork[]>([])
  const [activeFilters, setActiveFilters] = useState<FilterState>({
    style: '',
    subject: '',
    colors: '',
    search: ''
  })
  const [isFiltering, setIsFiltering] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false) // Track if search has completed
  const [showDesktopFilters, setShowDesktopFilters] = useState(false)
  const [showFallbackMessage, setShowFallbackMessage] = useState(false)

  // Use filtered artworks if filtering is active
  const currentArtworkList = isFiltering ? filteredArtworks : artworks
  const currentArtwork = currentArtworkList[currentIndex]

  // Extract available tags from artworks for predictive text
  const availableTags = useMemo(() => {
    const styles = new Set<string>()
    const subjects = new Set<string>()
    const colors = new Set<string>()

    artworks.forEach(artwork => {
      if (artwork.style) styles.add(artwork.style)
      if (artwork.genre) styles.add(artwork.genre)
      if (artwork.subject) subjects.add(artwork.subject)
      if (artwork.colour) {
        // Split comma-separated colors
        artwork.colour.split(',').forEach(color => {
          const trimmed = color.trim()
          if (trimmed) colors.add(trimmed)
        })
      }
    })

    return {
      styles: Array.from(styles).sort(),
      subjects: Array.from(subjects).sort(),
      colors: Array.from(colors).sort()
    }
  }, [artworks])

  // Add new state for end of matches overlay
  const [showEndOfMatchesOverlay, setShowEndOfMatchesOverlay] = useState(false);

  const [dbCollection, setDbCollection] = useState<Artwork[]>([]);

  // Enhanced localStorage helpers for temporary collection
  const saveTemporaryCollection = (newCollection: Artwork[]) => {
    try {
      localStorage.setItem('kaleidorium_temp_collection', JSON.stringify(newCollection));
      setCollectionCount(newCollection.length);
    } catch (error) {
      console.error('Failed to save temporary collection:', error);
    }
  };

  const loadTemporaryCollection = (): Artwork[] => {
    try {
      const saved = localStorage.getItem('kaleidorium_temp_collection');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Failed to load temporary collection:', error);
      return [];
    }
  };

  // Load temporary collection on mount for anonymous users
  useEffect(() => {
    if (mounted && !user) {
      const savedCollection = loadTemporaryCollection();
      setCollection(savedCollection);
      setCollectionCount(savedCollection.length);
    }
  }, [mounted, user, setCollectionCount]);

  // Update collection count when collection changes
  useEffect(() => {
    if (!user) {
      setCollectionCount(collection.length);
    } else {
      setCollectionCount(dbCollection.length);
    }
  }, [collection.length, dbCollection.length, user, setCollectionCount]);

  // Session storage helpers for preserving Discover state
  // Debounce timer for session saves to prevent excessive saves
  const saveSessionTimerRef = useRef<NodeJS.Timeout | null>(null);

  const saveDiscoverSession = useCallback(() => {
    // Clear any pending save
    if (saveSessionTimerRef.current) {
      clearTimeout(saveSessionTimerRef.current);
    }
    
    // Debounce the save to prevent excessive writes
    saveSessionTimerRef.current = setTimeout(() => {
      try {
        if (artworks.length > 0) {
          const sessionData = {
            artworks: artworks,
            currentIndex: currentIndex,
            timestamp: Date.now(),
            userId: user?.id || 'anonymous'
          };
          sessionStorage.setItem('kaleidorium_discover_session', JSON.stringify(sessionData));
          console.log('💾 Saved Discover session:', { artworksCount: artworks.length, currentIndex, userId: sessionData.userId });
        }
      } catch (error) {
        console.error('Error saving Discover session:', error);
      }
    }, 500); // 500ms debounce
  }, [artworks, currentIndex, user?.id]);

  const restoreDiscoverSession = useCallback((): { artworks: Artwork[]; currentIndex: number } | null => {
    try {
      const sessionDataStr = sessionStorage.getItem('kaleidorium_discover_session');
      if (!sessionDataStr) return null;

      const sessionData = JSON.parse(sessionDataStr);
      const sessionAge = Date.now() - sessionData.timestamp;
      const maxSessionAge = 24 * 60 * 60 * 1000; // 24 hours

      // Check if session is for the same user (or both anonymous)
      const isSameUser = (user?.id || 'anonymous') === (sessionData.userId || 'anonymous');

      // Only restore if session is recent and for the same user
      if (sessionAge < maxSessionAge && isSameUser && sessionData.artworks && sessionData.artworks.length > 0) {
        console.log('📂 Restored Discover session:', { artworksCount: sessionData.artworks.length, currentIndex: sessionData.currentIndex, userId: sessionData.userId });
        return {
          artworks: sessionData.artworks,
          currentIndex: sessionData.currentIndex || 0
        };
      } else {
        // Clear stale session
        sessionStorage.removeItem('kaleidorium_discover_session');
        console.log('🗑️ Cleared stale Discover session');
        return null;
      }
    } catch (error) {
      console.error('Error restoring Discover session:', error);
      return null;
    }
  }, [user?.id]);

  // Debug logging for mobile menu state
  useEffect(() => {
    console.log('Mobile menu state:', { showMenuModal, isMobile, isTablet, view });
  }, [showMenuModal, isMobile, isTablet, view]);

  // Reset selected artwork when navigating to collection view
  useEffect(() => {
    if (view === "collection") {
      setSelectedCollectionArtwork(null);
    }
  }, [view]);

  // Initialize EmailJS with proper error handling
  useEffect(() => {
    const init = async () => {
      const initialized = await initEmailJS()
      if (!initialized) {
        console.error('Failed to initialize EmailJS')
      }
    }
    init()
  }, [])

  // Preference weight constants
  const WEIGHTS = {
    ADD_TO_COLLECTION: 2.0,
    LIKE: 0.6,
    DISLIKE: -0.8,
    COLLECTION_MATCH: 1.5
  }

  // Helper function to update preferences
  const updatePreferences = async (userId: string, artwork: Artwork, action: 'add' | 'like' | 'dislike') => {
    try {
      console.log('updatePreferences: called', { userId, artwork, action });
      // Get current collector record
      const { data: collector, error: fetchError } = await supabase
        .from('Collectors')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching collector:', fetchError)
        return null
      }

      // Calculate weight based on action
      const weight = WEIGHTS[action.toUpperCase() as keyof typeof WEIGHTS]

      // Initialize or update preference counts and scores
      const preferences = collector?.preferences || {
        artists: {},
        genres: {},
        styles: {},
        subjects: {},
        colors: {},
        priceRanges: {},
        interactionCount: 0,
        viewed_artworks: []
      }

      // Add artwork to viewed list if not already there
      if (!preferences.viewed_artworks.includes(artwork.id)) {
        preferences.viewed_artworks.push(artwork.id)
      }

      // Update counts and scores
      function updateCount(
        category: 'artists' | 'genres' | 'styles' | 'subjects' | 'colors' | 'priceRanges',
        value: string | undefined
      ): void {
        if (!value) return;
        const categoryMap: Record<string, number> = { ...(preferences[category] as Record<string, number>) };
        categoryMap[value] = (categoryMap[value] || 0) + weight;
        preferences[category] = categoryMap as any;
      }

      // Update all preference categories
      updateCount('artists', artwork.artist)
      updateCount('genres', artwork.genre)
      updateCount('styles', artwork.style)
      updateCount('subjects', artwork.subject)
      updateCount('colors', artwork.colour)

      // Update price range preference
      const priceValue = parseFloat(artwork.price.replace(/[^0-9.-]+/g, ""))
      if (!isNaN(priceValue)) {
        const priceRange = Math.floor(priceValue / 1000) * 1000 // Group by thousands
        updateCount('priceRanges', priceRange.toString())
      }

      // Increment interaction count
      preferences.interactionCount = (preferences.interactionCount || 0) + 1

      // Update collector record
      const updateData = {
        id: collector?.id || userId,
        user_id: userId,
        preferences,
        last_interaction: new Date().toISOString(),
        created_at: collector?.created_at || new Date().toISOString()
      }

      const { error: upsertError } = await supabase
        .from('Collectors')
        .upsert(updateData, {
          onConflict: 'id',
          ignoreDuplicates: false
        })

      if (upsertError) {
        console.error('❌ Error updating collector preferences:', upsertError);
        console.error('❌ Update data that failed:', JSON.stringify(updateData, null, 2));
        console.error('❌ Error details:', {
          code: upsertError.code,
          message: upsertError.message,
          details: upsertError.details,
          hint: upsertError.hint
        });
        return null
      }
      console.log('✅ updatePreferences: success', {
        userId,
        artworkId: artwork.id,
        action,
        viewed_artworks_count: preferences.viewed_artworks.length,
        viewed_artworks: preferences.viewed_artworks
      });
      return updateData
    } catch (error) {
      console.error('Error updating preferences:', error)
      return null
    }
  }

  // Function to get artwork recommendations using OpenAI API
  const getRecommendations = async (userId: string, artworks: Artwork[]) => {
    try {
      console.log('getRecommendations: called', { userId, artworksLength: artworks.length });
      
      // Get collector preferences and collection
      const { data: collector, error: fetchError } = await supabase
        .from('Collectors')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (fetchError) {
        console.error('❌ Error fetching collector preferences:', fetchError)
        return artworks
      }

      if (!collector) {
        console.log('⚠️ No collector found for recommendations')
        return artworks
      }

      const preferences = collector.preferences || {}
      const viewedArtworks = preferences.viewed_artworks || []
      
      console.log('📊 getRecommendations: preferences', {
        viewed_artworks_count: viewedArtworks.length,
        viewed_artworks: viewedArtworks.slice(0, 5), // Log first 5 for debugging
        artworks_input_count: artworks.length
      });
      
      // Filter out viewed artworks
      const unviewedArtworks = artworks.filter(artwork => !viewedArtworks.includes(artwork.id))
      
      console.log('📊 getRecommendations: filtered', {
        unviewed_count: unviewedArtworks.length,
        filtered_out_count: artworks.length - unviewedArtworks.length
      });
      
      // If no unviewed artworks left, reset viewed_artworks and use all artworks
      if (unviewedArtworks.length === 0) {
        console.log('All artworks viewed, resetting viewed_artworks')
        preferences.viewed_artworks = []
        await supabase
          .from('Collectors')
          .update({ preferences })
          .eq('user_id', userId)
        return artworks
      }

      // Call the OpenAI recommendations API
      try {
        console.log('Calling OpenAI recommendations API...');
        const response = await fetch('/api/recommendations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            preferences: preferences,
            artworks: unviewedArtworks
          })
        });

        if (!response.ok) {
          throw new Error(`Recommendations API error: ${response.status}`);
        }

        const data = await response.json();
        console.log('Received recommendations from OpenAI:', data);

        if (data.response && data.response.recommendations) {
          const recommendedIds = data.response.recommendations;
          console.log('Recommended artwork IDs:', recommendedIds);
          
          // Reorder artworks based on OpenAI recommendations
          const recommendedArtworks = [];
          const remainingArtworks = [...unviewedArtworks];
          
          // Add artworks in the order recommended by OpenAI
          for (const id of recommendedIds) {
            const artworkIndex = remainingArtworks.findIndex(artwork => artwork.id === id);
            if (artworkIndex !== -1) {
              recommendedArtworks.push(remainingArtworks.splice(artworkIndex, 1)[0]);
            }
          }
          
          // Add any remaining artworks that weren't in the recommendations
          recommendedArtworks.push(...remainingArtworks);
          
          console.log('getRecommendations: reordered by OpenAI', recommendedArtworks.length);
          return recommendedArtworks;
        } else {
          console.warn('Invalid response from recommendations API, using fallback');
          return unviewedArtworks;
        }
      } catch (apiError) {
        console.error('Error calling recommendations API, using fallback scoring:', apiError);
        
        // Fallback to local scoring if API fails
        return unviewedArtworks.sort((a, b) => {
          // Simple fallback: prioritize by collection matches and preferences
          let scoreA = 0;
          let scoreB = 0;
          
          // Basic preference matching with proper type checking
          if (a.artist && preferences.artists?.[a.artist]) scoreA += preferences.artists[a.artist];
          if (b.artist && preferences.artists?.[b.artist]) scoreB += preferences.artists[b.artist];
          if (a.genre && preferences.genres?.[a.genre]) scoreA += preferences.genres[a.genre];
          if (b.genre && preferences.genres?.[b.genre]) scoreB += preferences.genres[b.genre];
          if (a.style && preferences.styles?.[a.style]) scoreA += preferences.styles[a.style];
          if (b.style && preferences.styles?.[b.style]) scoreB += preferences.styles[b.style];
          
          return scoreB - scoreA;
        });
      }
    } catch (error) {
      console.error('Error getting recommendations:', error)
      return artworks
    }
  }

  // User authentication is now handled by parent component (page.tsx)
  // No need for duplicate auth listeners here

  // Helper function to ensure collector profile exists
  const ensureCollectorProfile = async (user: any) => {
    const { data: collector } = await supabase
      .from('Collectors')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!collector) {
      await supabase
        .from('Collectors')
        .insert({
          user_id: user.id,
          created_at: new Date().toISOString()
        })
    }
  }

  // Update the handleAuthAction function
  const handleAuthAction = async (action: 'like' | 'dislike' | 'add', artwork: Artwork) => {
    const { data: { session } } = await supabase.auth.getSession()

    if (action === 'add' && !session) {
      setShowAuthModal(true)
      toast({
        title: "Registration required",
        description: "Please register to add artworks to your collection.",
      })
      return false
    }

    if (!session) {
      // Create or get temporary user profile
      const tempId = localStorage.getItem('tempUserId') || uuidv4()
      localStorage.setItem('tempUserId', tempId)

      // Check if temporary profile exists
      const { data: tempProfile } = await supabase
        .from('UserProfile')
        .select('*')
        .eq('id', tempId)
        .maybeSingle()

      if (!tempProfile) {
        // Create temporary profile
        await supabase
          .from('UserProfile')
          .insert({
            id: tempId,
            email: '',
            art_spending_range: '0-999',
            is_temporary: true,
            last_session: new Date().toISOString(),
          })

        // Create temporary collector profile
        await supabase
          .from('Collectors')
          .insert({
            user_id: tempId,
            preferences: {
              artists: {},
              genres: {},
              styles: {},
              subjects: {},
              colors: {},
              priceRanges: {},
              interactionCount: 0,
              viewed_artworks: [],
            },
            is_temporary: true,
          })
      }

      return true
    }

    return true
  }

  // Helper to extract style/genre/subject from tags when fields are missing
  const extractFromTags = (tags: string[] | undefined, field: 'style' | 'genre' | 'subject' | 'colour'): string | undefined => {
    if (!tags || tags.length === 0) return undefined;
    
    const tagString = tags.join(' ').toLowerCase();
    
    // Common style keywords
    if (field === 'style') {
      const styleKeywords = ['abstract', 'realism', 'impressionism', 'expressionism', 'surrealism', 'pop art', 'minimalism', 'contemporary', 'modern', 'classical', 'baroque', 'renaissance'];
      for (const keyword of styleKeywords) {
        if (tagString.includes(keyword)) {
          return keyword;
        }
      }
    }
    
    // Common genre keywords
    if (field === 'genre') {
      const genreKeywords = ['portrait', 'landscape', 'still life', 'figure', 'cityscape', 'seascape', 'abstract', 'nude'];
      for (const keyword of genreKeywords) {
        if (tagString.includes(keyword)) {
          return keyword;
        }
      }
    }
    
    // Common subject keywords
    if (field === 'subject') {
      const subjectKeywords = ['portrait', 'landscape', 'still life', 'figure', 'cityscape', 'seascape', 'nature', 'urban', 'animal', 'flower'];
      for (const keyword of subjectKeywords) {
        if (tagString.includes(keyword)) {
          return keyword;
        }
      }
    }
    
    // Common color keywords
    if (field === 'colour') {
      const colorKeywords = ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'black', 'white', 'brown', 'grey', 'gray', 'gold', 'silver'];
      for (const keyword of colorKeywords) {
        if (tagString.includes(keyword)) {
          return keyword;
        }
      }
    }
    
    return undefined;
  };

  // Helper to update local preferences
  const updateLocalPreferences = (
    artwork: Artwork,
    action: 'add' | 'like' | 'dislike',
    options?: { incrementInteraction?: boolean }
  ) => {
    const { incrementInteraction = true } = options ?? {}
    const weightMap = {
      add: WEIGHTS.ADD_TO_COLLECTION,
      like: WEIGHTS.LIKE,
      dislike: WEIGHTS.DISLIKE
    };
    const weight = weightMap[action];
    const updated = { ...localPreferences };
    if (!updated.viewed_artworks.includes(artwork.id)) {
      updated.viewed_artworks.push(artwork.id);
    }
    function updateCount(
      category: 'artists' | 'genres' | 'styles' | 'subjects' | 'colors' | 'priceRanges',
      value: string | undefined
    ): void {
      if (!value) return;
      const categoryMap: Record<string, number> = { ...(updated[category] as Record<string, number>) };
      categoryMap[value] = (categoryMap[value] || 0) + weight;
      updated[category] = categoryMap as any;
    }
    updateCount('artists', artwork.artist);
    
    // Use field value if available, otherwise try to extract from tags
    const genre = artwork.genre || extractFromTags(artwork.tags, 'genre');
    const style = artwork.style || extractFromTags(artwork.tags, 'style');
    const subject = artwork.subject || extractFromTags(artwork.tags, 'subject');
    const colour = artwork.colour || extractFromTags(artwork.tags, 'colour');
    
    updateCount('genres', genre);
    updateCount('styles', style);
    updateCount('subjects', subject);
    updateCount('colors', colour);
    const priceValue = parseFloat(artwork.price.replace(/[^0-9.-]+/g, ""));
    if (!isNaN(priceValue)) {
      const priceRange = Math.floor(priceValue / 1000) * 1000;
      updateCount('priceRanges', priceRange.toString());
    }
    if (incrementInteraction) {
      updated.interactionCount = (updated.interactionCount || 0) + 1;
    }
    setLocalPreferences(updated);
    return updated;
  };

  // Helper to get recommendations for anonymous users
  // Accepts optional preferences parameter to use updated preferences immediately (fixes stale state issue)
  const getLocalRecommendations = (artworks: Artwork[], preferencesOverride?: typeof localPreferences) => {
    const preferences = preferencesOverride || localPreferences; // Use override if provided, otherwise use state
    const viewedArtworks = preferences.viewed_artworks || [];
    const unviewedArtworks = artworks.filter(artwork => !viewedArtworks.includes(artwork.id));
    if (unviewedArtworks.length === 0) {
      const prefsToUpdate = preferencesOverride || { ...localPreferences };
      prefsToUpdate.viewed_artworks = [];
      if (!preferencesOverride) {
        setLocalPreferences(prefsToUpdate);
      }
      return artworks;
    }
    // Score logic (same as before)
    const scoredArtworks = unviewedArtworks.map(artwork => {
      let score = 0;
      const calculateCategoryScore = (
        category: 'artists' | 'genres' | 'styles' | 'subjects' | 'colors' | 'priceRanges',
        value: string | undefined
      ): number => {
        if (!value) return 0;
        let score = 0;
        // Check both the exact value and lowercase version for matching
        const valueLower = value.toLowerCase();
        if (preferences[category]?.[value]) {
          score += preferences[category][value];
        } else if (preferences[category]?.[valueLower]) {
          score += preferences[category][valueLower];
        }
        return score;
      };
      score += calculateCategoryScore('artists', artwork.artist) * 2.5;
      
      // Use field value if available, otherwise try to extract from tags (same logic as updateLocalPreferences)
      const genre = artwork.genre || extractFromTags(artwork.tags, 'genre');
      const style = artwork.style || extractFromTags(artwork.tags, 'style');
      const subject = artwork.subject || extractFromTags(artwork.tags, 'subject');
      const colour = artwork.colour || extractFromTags(artwork.tags, 'colour');
      
      score += calculateCategoryScore('genres', genre) * 2.0;
      score += calculateCategoryScore('styles', style) * 2.0;
      score += calculateCategoryScore('subjects', subject) * 1.5;
      score += calculateCategoryScore('colors', colour) * 1.0;
      const priceValue = parseFloat(artwork.price.replace(/[^0-9.-]+/g, ""));
      if (!isNaN(priceValue)) {
        const priceRange = Math.floor(priceValue / 1000) * 1000;
        score += calculateCategoryScore('priceRanges', priceRange.toString()) * 0.8;
      }
      return { ...artwork, score };
    });
    return scoredArtworks.sort((a, b) => {
      const scoreDiff = b.score - a.score;
      return Math.abs(scoreDiff) < 0.2 ? Math.random() - 0.5 : scoreDiff;
    });
  };

  // Helper to check if all artworks have been viewed
  const checkEndOfMatches = (artworksList: Artwork[], viewed: string[]) => {
    return artworksList.length > 0 && artworksList.every(a => viewed.includes(a.id));
  };

  // Refactored handleDislike
  const handleDislike = useCallback(async (artworkParam?: Artwork) => {
    const artwork = artworkParam || currentArtwork;
    if (!mounted || !artwork) return;
    
    // Track interaction for registration prompt
    trackInteraction();
    
    // Track analytics
    await trackAnalytics(artwork.id, 'dislike', user?.id);
    
    if (!user) {
      isUpdatingArtworksRef.current = true; // Prevent session restoration during update
      const updatedPreferences = updateLocalPreferences(artwork, 'dislike');
      // Filter out the disliked artwork immediately before getting recommendations
      // This ensures it doesn't appear even if state hasn't updated yet
      const filteredArtworks = artworks.filter(a => a.id !== artwork.id);
      // Pass updatedPreferences directly to use fresh dislike weights (fixes stale state issue)
      const recommendedArtworks = getLocalRecommendations(filteredArtworks, updatedPreferences);
      
      // Calculate the new index: if current artwork was removed, stay at 0, otherwise adjust
      let newIndex = currentIndex;
      if (currentIndex >= filteredArtworks.length) {
        // If the removed artwork was at or near the end, reset to 0
        newIndex = 0;
      } else if (artworks[currentIndex]?.id === artwork.id) {
        // If we're currently viewing the disliked artwork, move to next (or 0 if at end)
        newIndex = currentIndex >= filteredArtworks.length ? 0 : currentIndex;
      }
      
      setArtworks(recommendedArtworks);
      setCurrentIndex(newIndex);
      // Save session after updating artworks (debounced)
      saveDiscoverSession();
      // Check for end of matches
      if (checkEndOfMatches(recommendedArtworks, updatedPreferences.viewed_artworks)) {
        setShowEndOfMatchesOverlay(true);
      }
      // Reset flag after a short delay to allow state updates to complete
      setTimeout(() => {
        isUpdatingArtworksRef.current = false;
      }, 1000);
      return;
    }
    if (!await handleAuthAction('dislike', artwork)) return;
    const newPreferences = await updatePreferences(user.id, artwork, 'dislike');
    if (newPreferences) {
      // Filter out the disliked artwork immediately before getting recommendations
      // This ensures it doesn't appear even if there's a database caching delay
      const filteredArtworks = artworks.filter(a => a.id !== artwork.id);
      const recommendedArtworks = await getRecommendations(user.id, filteredArtworks);
      
      // Calculate the new index: if current artwork was removed, stay at 0, otherwise adjust
      let newIndex = currentIndex;
      if (currentIndex >= filteredArtworks.length) {
        // If the removed artwork was at or near the end, reset to 0
        newIndex = 0;
      } else if (artworks[currentIndex]?.id === artwork.id) {
        // If we're currently viewing the disliked artwork, move to next (or 0 if at end)
        newIndex = currentIndex >= filteredArtworks.length ? 0 : currentIndex;
      }
      
      setArtworks(recommendedArtworks);
      setCurrentIndex(newIndex);
      
      // Save session after updating artworks (debounced)
      saveDiscoverSession();
      // Check for end of matches
      if (checkEndOfMatches(recommendedArtworks, newPreferences.preferences.viewed_artworks)) {
        setShowEndOfMatchesOverlay(true);
      }
    } else {
      // If updatePreferences failed, still move to next artwork
      const newIndex = currentIndex === artworks.length - 1 ? 0 : currentIndex + 1;
      setCurrentIndex(newIndex);
    }
  }, [mounted, currentArtwork, currentIndex, artworks.length, toast, user, artworks, localPreferences, trackInteraction, saveDiscoverSession]);

  // Refactored handleLike
  const handleLike = useCallback(async (artworkParam?: Artwork) => {
    const artwork = artworkParam || currentArtwork;
    if (!mounted || !artwork) return;
    
    // Track interaction for registration prompt
    trackInteraction();
    
    // Track analytics for both like and add_to_collection
    await trackAnalytics(artwork.id, 'like', user?.id);
    await trackAnalytics(artwork.id, 'add_to_collection', user?.id);
    
    if (!user) {
      isUpdatingArtworksRef.current = true; // Prevent session restoration during update
      const updatedPreferences = updateLocalPreferences(artwork, 'add');
      
      if (artwork && artwork.id && !collection.some((item) => item.id === artwork.id)) {
        const newCollection = [...collection, artwork];
        setCollection(newCollection);
        saveTemporaryCollection(newCollection);
      }

      // Pass updatedPreferences directly to use fresh like/add weights (fixes stale state issue)
      const recommendedArtworks = getLocalRecommendations(artworks, updatedPreferences);
      setArtworks(recommendedArtworks);
      const newIndex = currentIndex === artworks.length - 1 ? 0 : currentIndex + 1;
      setCurrentIndex(newIndex);
      // Save session after updating artworks
      saveDiscoverSession();
      if (checkEndOfMatches(recommendedArtworks, [...localPreferences.viewed_artworks, artwork.id])) {
        setShowEndOfMatchesOverlay(true);
      }
      // Reset flag after a short delay to allow state updates to complete
      setTimeout(() => {
        isUpdatingArtworksRef.current = false;
      }, 1000);
      return;
    }

    if (!await handleAuthAction('add', artwork)) return;
    const addPreferences = await updatePreferences(user.id, artwork, 'add');
    if (user && artwork && artwork.id) {
      const { data: existing, error: checkError } = await supabase
        .from('Collection')
        .select('id')
        .eq('user_id', user.id)
        .eq('artwork_id', Number(artwork.id))
        .maybeSingle();

      if (checkError) {
        console.error("Error checking if artwork is in collection:", checkError);
        toast({
          title: "Error",
          description: "Could not check your collection. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (!existing) {
        const { error: insertError } = await supabase
          .from('Collection')
          .insert({ user_id: user.id, artwork_id: Number(artwork.id) });

        if (insertError) {
          console.error('Insert error:', insertError);
          toast({
            title: "Error saving to collection",
            description: insertError.message,
            variant: "destructive",
          });
          return;
        } else {
          fetchUserCollection();
        }
      }
    }

    if (addPreferences) {
      const recommendedArtworks = await getRecommendations(user.id, artworks);
      setArtworks(recommendedArtworks);
      // Save session after updating artworks
      saveDiscoverSession();
      if (checkEndOfMatches(recommendedArtworks, addPreferences.preferences.viewed_artworks)) {
        setShowEndOfMatchesOverlay(true);
      }
    }

    const newIndex = currentIndex === artworks.length - 1 ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  }, [
    mounted,
    currentArtwork,
    currentIndex,
    artworks.length,
    toast,
    user,
    artworks,
    localPreferences,
    trackInteraction,
    collection,
    saveTemporaryCollection,
    getLocalRecommendations,
    checkEndOfMatches,
    handleAuthAction,
    updatePreferences,
    fetchUserCollection,
    getRecommendations,
    setCollection,
    saveDiscoverSession
  ]);

  // Enhanced handleAddToCollection with localStorage persistence
  const handleAddToCollection = useCallback(async (artworkParam?: Artwork) => {
    const artwork = artworkParam || currentArtwork;
    if (!mounted || !artwork) return;
    
    // Track interaction for registration prompt
    trackInteraction();
    
    // Track analytics
    await trackAnalytics(artwork.id, 'add_to_collection', user?.id);
    
    if (!user) {
      const updatedPreferences = updateLocalPreferences(artwork, 'add');
      if (artwork && artwork.id && !collection.some((item) => item.id === artwork.id)) {
        const newCollection = [...collection, artwork];
        setCollection(newCollection);
        saveTemporaryCollection(newCollection); // Persist to localStorage
        // Note: Toast message is handled by the calling component (CardStack/MobileCardStack)
      }
      // Pass updatedPreferences directly to use fresh add weights (fixes stale state issue)
      const recommendedArtworks = getLocalRecommendations(artworks, updatedPreferences);
      setArtworks(recommendedArtworks);
      const newIndex = currentIndex === artworks.length - 1 ? 0 : currentIndex + 1;
      setCurrentIndex(newIndex);
      // Save session after updating artworks
      saveDiscoverSession();
      // Check for end of matches
      if (checkEndOfMatches(recommendedArtworks, [...localPreferences.viewed_artworks, artwork.id])) {
        setShowEndOfMatchesOverlay(true);
      }
      return;
    }
    if (!await handleAuthAction('add', artwork)) return;
    const newPreferences = await updatePreferences(user.id, artwork, 'add');
    if (newPreferences) {
      const recommendedArtworks = await getRecommendations(user.id, artworks);
      setArtworks(recommendedArtworks);
      // Save session after updating artworks
      saveDiscoverSession();
      // Check for end of matches
      if (checkEndOfMatches(recommendedArtworks, newPreferences.preferences.viewed_artworks)) {
        setShowEndOfMatchesOverlay(true);
      }
    }
    if (user && artwork && artwork.id) {
      // Check if already in collection using maybeSingle to avoid errors on no results
      const { data: existing, error: checkError } = await supabase
        .from('Collection')
        .select('id')
        .eq('user_id', user.id)
        .eq('artwork_id', Number(artwork.id))
        .maybeSingle();

      if (checkError) {
        console.error("Error checking if artwork is in collection:", checkError);
        toast({
          title: "Error",
          description: "Could not check your collection. Please try again.",
          variant: "destructive",
        });
        // Return to prevent advancing to the next artwork if the check fails.
        return;
      }

      if (!existing) {
        // If it doesn't exist, insert it.
        const { error: insertError } = await supabase
          .from('Collection')
          .insert({ user_id: user.id, artwork_id: Number(artwork.id) });

        if (insertError) {
          console.error('Insert error:', insertError);
          toast({
            title: "Error saving to collection",
            description: insertError.message,
            variant: "destructive",
          });
        } else {
          // Note: Success toast message is handled by the calling component (CardStack/MobileCardStack)
          fetchUserCollection(); // Refetch the collection.
        }
      } else {
        // Note: "Already in collection" toast message is handled by the calling component
      }
    }
    const newIndex = currentIndex === artworks.length - 1 ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  }, [mounted, currentArtwork, currentIndex, artworks.length, collection, toast, user, artworks, localPreferences, trackInteraction, saveDiscoverSession]);

  // Load recommendations in background without blocking the main loading
  const loadRecommendationsInBackground = useCallback(async (userId: string, defaultArtworks: Artwork[]) => {
    try {
      console.log('🔄 Background: Fetching collector preferences for user:', userId);
      
      const { data: collector, error: collectorError } = await supabase
        .from('Collectors')
        .select('id, preferences')
        .eq('user_id', userId)
        .maybeSingle();

      if (collectorError) {
        console.error('🚨 Background: Error fetching collector preferences:', collectorError);
        return; // Just return, don't block the app
      }

      if (collector?.preferences) {
        console.log('🔄 Background: Found collector preferences, getting recommendations...');
        try {
          const recommendedArtworks = await getRecommendations(userId, defaultArtworks);
          console.log('✅ Background: Recommendations loaded, updating artworks');
          setArtworks(recommendedArtworks);
          // Save session after recommendations are loaded
          setTimeout(() => {
            if (view === "discover") {
              saveDiscoverSession();
            }
          }, 100);
        } catch (recError) {
          console.error('🚨 Background: Error getting recommendations:', recError);
          // Keep default artworks if recommendations fail
        }
      } else {
        console.log('🔄 Background: No collector preferences found, keeping default artworks');
      }
    } catch (prefError) {
      console.error('🚨 Background: Error in background recommendations fetch:', prefError);
      // Continue with default artworks - don't let this block the app
    }
  }, [view, saveDiscoverSession]);

  // Update fetchArtworks to use recommendations if user exists
  const fetchArtworks = useCallback(async () => {
    // Prevent multiple simultaneous fetch calls
    if (fetchingRef.current) {
      console.log('fetchArtworks: Already fetching, skipping');
      return;
    }
    
    // NO VISIBILITY CHECKS - this was causing tab switch issues
    console.log('🚨 SIMPLE: fetchArtworks proceeding without visibility checks');
    
    try {
      console.log('🚀 Starting artwork fetch - no timeout limit');
      console.log('fetchArtworks: User:', user?.id || 'anonymous');
      console.log('fetchArtworks: Current artworks count:', artworks.length);
      fetchingRef.current = true;
      setLoading(true);
      setLoadingError(null); // Clear any previous errors
      
      console.log('fetchArtworks: Fetching artworks from Supabase...');
      
      // Full query without timeout - let it take as long as needed
      console.log('🔍 Full Supabase query - no timeout limit...');
      const startTime = Date.now();
      
      console.log('About to execute full Supabase query...');
      
      // Test basic network connectivity to Supabase
      console.log('Step 1: Testing basic connectivity to Supabase...');
      
      let artworksData = [];
      let error = null;
      
      try {
        // First test: Simple fetch to Supabase REST API
        const supabaseUrl = 'https://zeexxekmnbbntnmwfcat.supabase.co';
        const testUrl = `${supabaseUrl}/rest/v1/Artwork?select=id&limit=1`;
        
        console.log('Testing direct REST API call to:', testUrl);
        
        const fetchResponse = await fetch(testUrl, {
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!fetchResponse.ok) {
          throw new Error(`HTTP ${fetchResponse.status}: ${fetchResponse.statusText}`);
        }
        
        const fetchData = await fetchResponse.json();
        console.log('✅ Direct REST API call succeeded, got', fetchData?.length, 'records');
        
        // Since direct REST works, use it instead of the hanging Supabase client
        console.log('Step 2: Using direct REST API since Supabase client is hanging...');
        
        const fullRestUrl = `${supabaseUrl}/rest/v1/Artwork?select=id,artwork_title,artist,artwork_image,medium,dimensions,year,price,currency,description,tags,artwork_link,style,genre,subject,colour,created_at&limit=50`;
        
        console.log('Fetching full artwork data via REST API...');
        
        const fullFetchResponse = await fetch(fullRestUrl, {
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!fullFetchResponse.ok) {
          throw new Error(`HTTP ${fullFetchResponse.status}: ${fullFetchResponse.statusText}`);
        }
        
        const fullFetchData = await fullFetchResponse.json();
        console.log('✅ Full REST API call succeeded, got', fullFetchData?.length, 'records');
        artworksData = fullFetchData || [];
        
      } catch (networkError) {
        console.error('❌ Network connectivity issue:', networkError);
        error = networkError;
      }
      
      // If Supabase failed, use fallback data
      if (error || artworksData.length === 0) {
        console.log('⚠️ Using fallback data due to Supabase issue');
        
        const fallbackArtworks = [
          {
            id: "1",
            artwork_title: "Test Artwork",
            artist: "Test Artist",
            artwork_image: "/placeholder.svg",
            medium: "Digital Art",
            dimensions: "1920x1080",
            year: "2025",
            price: "Price on request",
            description: "This is a test artwork while we investigate the Supabase connection issue.",
            tags: ["test", "fallback"],
            artwork_link: undefined,
            style: "Digital Art",
            genre: "Contemporary",
            subject: "Abstract",
            colour: "Mixed",
            created_at: new Date().toISOString()
          }
        ];
        
        artworksData = fallbackArtworks;
        error = null;
      }
      
      console.log('Final result: Using', artworksData.length, 'artworks');
        
      const queryTime = Date.now() - startTime;
      console.log(`⏱️ Supabase query took ${queryTime}ms`);
      console.log('✅ Supabase query completed successfully');
      console.log('Raw Supabase response:', { artworksData, error });
      
      if (error) {
        console.error('🚨 SUPABASE ERROR:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
      }

      if (error) {
        console.error('Supabase error fetching artworks:', error);
        throw error;
      }

      if (!artworksData || artworksData.length === 0) {
        console.error('No artwork data received from Supabase');
        setArtworks([]);
        return;
      }

      console.log('Received artwork data:', artworksData.length, 'items');
      console.log('First artwork sample:', JSON.stringify(artworksData[0], null, 2));

      const transformedArtworks = artworksData.map((artwork: any) => {
        return {
          id: artwork.id?.toString() || Math.random().toString(),
          title: artwork.artwork_title || 'Untitled',
          artist: artwork.artist || 'Unknown Artist',
          medium: artwork.medium || 'Digital Art',
          dimensions: artwork.dimensions || '1920x1080',
          year: artwork.year || "2025",
          price: artwork.price || 'Price on request',
          currency: artwork.currency || undefined,
          description: artwork.description || 'No description available',
          tags: artwork.tags || [],
          artwork_image: artwork.artwork_image || "/placeholder.svg",
          link: artwork.artwork_link || undefined,
          created_at: artwork.created_at || new Date().toISOString(),
          updated_at: artwork.created_at || new Date().toISOString(),
          style: artwork.style || undefined,
          genre: artwork.genre || undefined,
          subject: artwork.subject || undefined,
          colour: artwork.colour || undefined
        };
      });

      
      // For registered users, check if they have preferences and get recommendations first
      // For anonymous users or users without preferences, use default artworks
      if (user) {
        console.log('Registered user detected, checking for personalized recommendations...');
        try {
          const { data: collector } = await supabase
            .from('Collectors')
            .select('preferences')
            .eq('user_id', user.id)
            .maybeSingle();

          if (collector?.preferences) {
            console.log('✅ Found user preferences, loading personalized recommendations...');
            // User has preferences, get recommendations
            const recommendedArtworks = await getRecommendations(user.id, transformedArtworks);
            setArtworks(recommendedArtworks);
            // Save session after recommendations are loaded
            saveDiscoverSession();
          } else {
            console.log('No preferences found, using default artworks');
            setArtworks(transformedArtworks);
          }
        } catch (error) {
          console.error('Error checking for user preferences:', error);
          // Fallback to default artworks
          setArtworks(transformedArtworks);
        }
      } else {
        // Anonymous user - use default artworks
        setArtworks(transformedArtworks);
      }
    } catch (error) {
      console.error('🚨 EMERGENCY: Error in fetchArtworks:', error);
      
      // Force app to load even with error
      console.log('🚨 EMERGENCY: Forcing app to load despite error');
      setArtworks([]);
      setLoading(false);
      fetchingRef.current = false;
      
      const errorMessage = "Failed to load artworks. The app will continue with limited functionality.";
      setLoadingError(errorMessage);
      
      toast({
        title: "Error loading artworks",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      console.log('🚨 EMERGENCY: fetchArtworks finished - forcing loading off');
      fetchingRef.current = false;
      setLoading(false);
    }
  }, [user?.id, getRecommendations, saveDiscoverSession]) // Dependencies for recommendations

  // Save session when navigating away from Discover
  // Only save when view changes, not when artworks change (to prevent loops)
  useEffect(() => {
    if (view !== "discover" && artworks.length > 0) {
      saveDiscoverSession();
    }
  }, [view]); // Removed artworks and saveDiscoverSession from deps to prevent loops

  // Simplified initialization with tab visibility handling
  useEffect(() => {
    console.log('🚨 SIMPLE: ArtDiscovery component mounting...');
    setMounted(true);
    
    // Reset the update flag on mount to prevent it from being stuck
    isUpdatingArtworksRef.current = false;
    
    // NO VISIBILITY CHANGE HANDLING - this was causing tab switch reloads
    console.log('🚨 SIMPLE: No visibility change handler - preventing tab switch issues');
    
    return () => {
      // Clean up any pending session save
      if (saveSessionTimerRef.current) {
        clearTimeout(saveSessionTimerRef.current);
      }
      // Save session on unmount if on Discover page (immediate, no debounce)
      if (view === "discover" && artworks.length > 0) {
        try {
          const sessionData = {
            artworks: artworks,
            currentIndex: currentIndex,
            timestamp: Date.now(),
            userId: user?.id || 'anonymous'
          };
          sessionStorage.setItem('kaleidorium_discover_session', JSON.stringify(sessionData));
        } catch (error) {
          console.error('Error saving Discover session on unmount:', error);
        }
      }
    };
  }, [view, artworks, currentIndex, user?.id])
  
  useEffect(() => {
    // Only fetch if no artworks and on discover view
    if (mounted && artworks.length === 0 && view === "discover") {
      // Don't restore session if we're actively updating artworks (prevents loops)
      // But allow initial fetch even if flag is set (in case it got stuck)
      if (!isUpdatingArtworksRef.current) {
        // Try to restore session first
        const restored = restoreDiscoverSession();
        if (restored && restored.artworks.length > 0) {
          console.log('✅ Restored Discover session, using saved artworks');
          setArtworks(restored.artworks);
          setCurrentIndex(restored.currentIndex);
          setLoading(false);
          // For registered users, still load recommendations in background to update preferences
          if (user) {
            console.log('🔄 Loading fresh recommendations in background for registered user');
            loadRecommendationsInBackground(user.id, restored.artworks);
          }
          return;
        }
      } else {
        // If flag is stuck, reset it and proceed with fetch
        console.log('⚠️ isUpdatingArtworksRef was stuck, resetting and fetching');
        isUpdatingArtworksRef.current = false;
      }

      // If no session to restore, fetch artworks
      console.log('useEffect: Triggering fetchArtworks because mounted=', mounted, 'artworks.length=', artworks.length);
      fetchArtworks()
    }
  }, [mounted, user?.id, view, restoreDiscoverSession, loadRecommendationsInBackground, artworks.length, fetchArtworks]) // Added fetchArtworks to deps

  // Load more artworks for infinite scroll/prefetching
  // Only load more when NOT filtering/searching
  const loadMoreArtworks = useCallback(async () => {
    if (loading || isFiltering || isSearching) {
      console.log('⏸️ Skipping loadMoreArtworks: loading=', loading, 'isFiltering=', isFiltering, 'isSearching=', isSearching)
      return
    }
    
    try {
      setLoading(true)
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // For demo purposes, add shuffled versions of existing artworks
      const shuffledArtworks = [...artworks].sort(() => Math.random() - 0.5)
      const newArtworks = shuffledArtworks.slice(0, 6).map(artwork => ({
        ...artwork,
        id: `${artwork.id}_${Date.now()}_${Math.random()}` // Ensure unique IDs
      }))
      
      setArtworks(prev => [...prev, ...newArtworks])
    } catch (error) {
      console.error('Error loading more artworks:', error)
    } finally {
      setLoading(false)
    }
  }, [loading, artworks, isFiltering, isSearching])

  // Handle moving to the next artwork
  const handleNext = () => {
    const currentArtworkList = isFiltering ? filteredArtworks : artworks
    if (currentIndex < currentArtworkList.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  // Handle filter changes with intelligent fallback
  const handleFilterChange = async (filters: FilterState) => {
    console.log('🔍 Applying filters:', filters)
    console.log('🔍 Total artworks available:', artworks.length)
    setActiveFilters(filters)
    setIsFiltering(true)
    setCurrentIndex(0) // Reset to first artwork
    
    // If search term is provided, query API endpoint for better results
    let artworksToFilter = artworks
    let isSearchFromAPI = false // Track if we got results from API
    if (filters.search && filters.search.trim()) {
      console.log('🔍 Search term detected, querying API...', filters.search)
      setIsSearching(true) // Set loading state
      setShowFallbackMessage(false) // Hide fallback message while searching
      try {
        const searchTerm = filters.search.trim()
        console.log('🔍 Calling API with search term:', searchTerm)
        const response = await fetch(`/api/search-artworks?q=${encodeURIComponent(searchTerm)}`)
        console.log('🔍 API response status:', response.status)
        
        if (response.ok) {
          const data = await response.json()
          console.log('🔍 API response data:', data)
          if (data.results && data.results.length > 0) {
            console.log(`✅ Found ${data.results.length} artworks from API search`)
            // Deduplicate by ID to prevent duplicates
            const uniqueResults = data.results.filter((artwork: Artwork, index: number, self: Artwork[]) => 
              index === self.findIndex((a: Artwork) => a.id === artwork.id)
            )
            console.log(`✅ Deduplicated to ${uniqueResults.length} unique artworks`)
            artworksToFilter = uniqueResults
            isSearchFromAPI = true // Mark that we're using API results
          } else {
            console.log('⚠️ No results from API search, using local artworks')
            console.log('🔍 API returned:', data)
            isSearchFromAPI = false
          }
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
          console.error('❌ API search error:', response.status, errorData)
          // Fall back to local artworks if API fails
          isSearchFromAPI = false
        }
      } catch (error) {
        console.error('❌ Error calling search API:', error)
        // Fall back to local artworks if API call fails
        isSearchFromAPI = false
      } finally {
        setIsSearching(false) // Clear loading state
        setHasSearched(true) // Mark that search has completed
      }
    } else {
      console.log('🔍 No search term provided, using local artworks')
      setIsSearching(false)
      setHasSearched(false) // Reset when no search
      isSearchFromAPI = false
    }
    
    // Strategy 1: Try exact matching (all filters must match)
    let filtered = artworksToFilter.filter(artwork => {
      let matches = true
      
      // Filter by search (title or artist) - only if we didn't get results from API
      // API results are already filtered by search, so skip this step
      if (filters.search && filters.search.trim() && !isSearchFromAPI) {
        const searchTerm = filters.search.toLowerCase().trim()
        const artworkTitle = (artwork.title || '').toLowerCase()
        const artworkArtist = (artwork.artist || '').toLowerCase()
        const searchMatch = artworkTitle.includes(searchTerm) || artworkArtist.includes(searchTerm)
        matches = matches && searchMatch
      }
      
      // Filter by style
      if (filters.style.trim()) {
        const styleKeywords = filters.style.toLowerCase().split(',').map(s => s.trim())
        const artworkStyle = (artwork.style || '').toLowerCase()
        const artworkGenre = (artwork.genre || '').toLowerCase()
        const artworkTags = (artwork.tags || []).map(tag => tag.toLowerCase())
        
        const styleMatch = styleKeywords.some(keyword => 
          artworkStyle.includes(keyword) || 
          artworkGenre.includes(keyword) ||
          artworkTags.some(tag => tag.includes(keyword))
        )
        matches = matches && styleMatch
      }
      
      // Filter by subject
      // Note: Also check genre field since terms like "still life", "portrait", "landscape" are genres
      if (filters.subject.trim()) {
        const subjectKeywords = filters.subject.toLowerCase().split(',').map(s => s.trim())
        const artworkSubject = (artwork.subject || '').toLowerCase()
        const artworkGenre = (artwork.genre || '').toLowerCase() // Also check genre field
        const artworkTitle = artwork.title.toLowerCase()
        const artworkTags = (artwork.tags || []).map(tag => tag.toLowerCase())
        
        const subjectMatch = subjectKeywords.some(keyword => {
          const keywordNormalized = keyword.replace(/\s+/g, ' ').trim() // Normalize multiple spaces to single space
          return artworkSubject.includes(keywordNormalized) || 
                 artworkGenre.includes(keywordNormalized) || // Check genre field too (e.g., "still life" is a genre)
                 artworkTitle.includes(keywordNormalized) ||
                 artworkTags.some(tag => tag.includes(keywordNormalized))
        })
        matches = matches && subjectMatch
      }
      
      // Filter by colors
      if (filters.colors.trim()) {
        const colorKeywords = filters.colors.toLowerCase().split(',').map(s => s.trim())
        const artworkColor = (artwork.colour || '').toLowerCase()
        const artworkTags = (artwork.tags || []).map(tag => tag.toLowerCase())
        
        const colorMatch = colorKeywords.some(keyword => 
          artworkColor.includes(keyword) ||
          artworkTags.some(tag => tag.includes(keyword))
        )
        matches = matches && colorMatch
      }
      
      return matches
    })
    
    // Strategy 2: If no exact matches, try partial matching (any filter can match)
    // Skip this if we got results from API (API already filtered by search)
    if (filtered.length === 0 && !isSearchFromAPI) {
      console.log('No exact matches found, trying partial matching...')
      filtered = artworksToFilter.filter(artwork => {
        let hasAnyMatch = false
        
        // Check search (title or artist) - only if we didn't already query API
        if (filters.search && filters.search.trim() && !isSearchFromAPI) {
          const searchTerm = filters.search.toLowerCase().trim()
          const artworkTitle = (artwork.title || '').toLowerCase()
          const artworkArtist = (artwork.artist || '').toLowerCase()
          if (artworkTitle.includes(searchTerm) || artworkArtist.includes(searchTerm)) {
            hasAnyMatch = true
          }
        }
        
        // Check style
        if (filters.style.trim()) {
          const styleKeywords = filters.style.toLowerCase().split(',').map(s => s.trim())
          const artworkStyle = (artwork.style || '').toLowerCase()
          const artworkGenre = (artwork.genre || '').toLowerCase()
          const artworkTags = (artwork.tags || []).map(tag => tag.toLowerCase())
          
          const styleMatch = styleKeywords.some(keyword => 
            artworkStyle.includes(keyword) || 
            artworkGenre.includes(keyword) ||
            artworkTags.some(tag => tag.includes(keyword))
          )
          if (styleMatch) hasAnyMatch = true
        }
        
        // Check subject
        // Note: Also check genre field since terms like "still life", "portrait", "landscape" are genres
        if (filters.subject.trim()) {
          const subjectKeywords = filters.subject.toLowerCase().split(',').map(s => s.trim())
          const artworkSubject = (artwork.subject || '').toLowerCase()
          const artworkGenre = (artwork.genre || '').toLowerCase() // Also check genre field
          const artworkTitle = artwork.title.toLowerCase()
          const artworkTags = (artwork.tags || []).map(tag => tag.toLowerCase())
          
          const subjectMatch = subjectKeywords.some(keyword => {
            const keywordNormalized = keyword.replace(/\s+/g, ' ').trim() // Normalize multiple spaces to single space
            return artworkSubject.includes(keywordNormalized) || 
                   artworkGenre.includes(keywordNormalized) || // Check genre field too (e.g., "still life" is a genre)
                   artworkTitle.includes(keywordNormalized) ||
                   artworkTags.some(tag => tag.includes(keywordNormalized))
          })
          if (subjectMatch) hasAnyMatch = true
        }
        
        // Check colors
        if (filters.colors.trim()) {
          const colorKeywords = filters.colors.toLowerCase().split(',').map(s => s.trim())
          const artworkColor = (artwork.colour || '').toLowerCase()
          const artworkTags = (artwork.tags || []).map(tag => tag.toLowerCase())
          
          const colorMatch = colorKeywords.some(keyword => 
            artworkColor.includes(keyword) ||
            artworkTags.some(tag => tag.includes(keyword))
          )
          if (colorMatch) hasAnyMatch = true
        }
        
        return hasAnyMatch
      })
    }
    
    // Deduplicate filtered results by ID to prevent duplicates
    const uniqueFiltered = filtered.filter((artwork, index, self) => 
      index === self.findIndex((a) => a.id === artwork.id)
    )
    
    console.log(`🔍 Filtered ${uniqueFiltered.length} unique artworks from ${artworksToFilter.length} total (${filtered.length - uniqueFiltered.length} duplicates removed)`)
    
    // Strategy 3: If still no matches, show empty list with fallback message
    // Only show if search has completed (not currently searching) and we have no results
    // Use a small delay to ensure state has settled
    if (uniqueFiltered.length === 0 && !isSearching && hasSearched) {
      console.log('No matches found, showing fallback message')
      // Use setTimeout to ensure this happens after state updates
      setTimeout(() => {
        setShowFallbackMessage(true)
      }, 50)
    } else if (uniqueFiltered.length > 0 || !hasSearched) {
      setShowFallbackMessage(false)
    }
    
    if (uniqueFiltered.length === 0) {
      console.log('🔍 No matches found.')
      if (filters.search && filters.search.trim()) {
        console.log(`🔍 Search term was: "${filters.search}"`)
        console.log('🔍 Sample artwork data for debugging:', artworksToFilter.slice(0, 3).map(a => ({
          title: a.title,
          artist: a.artist,
          subject: a.subject,
          genre: a.genre,
          style: a.style,
          tags: a.tags
        })))
      } else {
        console.log('🔍 Sample artwork data for debugging:', artworksToFilter.slice(0, 3).map(a => ({
          title: a.title,
          artist: a.artist,
          subject: a.subject,
          genre: a.genre,
          style: a.style,
          tags: a.tags
        })))
      }
    }
    setFilteredArtworks(uniqueFiltered)
  }

  // Clear filters function
  const clearFilters = () => {
    setIsFiltering(false)
    setActiveFilters({ style: '', subject: '', colors: '', search: '' })
    setFilteredArtworks([])
    setCurrentIndex(0)
    setShowFallbackMessage(false)
    setHasSearched(false) // Reset search state
    
    toast({
      title: "Filters Cleared",
      description: "Showing all artworks",
    })
  }

  // Handle mobile filter changes (convert array format to string format)
  const handleMobileFilterChange = (filters: { style: string[], subject: string[], colors: string[] }) => {
    const filterState = {
      style: filters.style.join(', '),
      subject: filters.subject.join(', '),
      colors: filters.colors.join(', '),
      search: '' // Mobile doesn't have search yet
    }
    handleFilterChange(filterState)
  }

  // Toggle desktop filters
  const toggleDesktopFilters = () => {
    setShowDesktopFilters(!showDesktopFilters)
  }

  // Expose toggle function to parent via callback
  useEffect(() => {
    if (onToggleDesktopFilters) {
      // Store the toggle function globally so parent can access it
      (window as any).toggleDesktopFilters = toggleDesktopFilters
    }
  }, [toggleDesktopFilters])

  // Expose clearFilters function globally so header can access it
  useEffect(() => {
    (window as any).clearArtDiscoveryFilters = clearFilters
    return () => {
      delete (window as any).clearArtDiscoveryFilters
    }
  }, [clearFilters])

  // Setup keyboard shortcuts only on the client side
  useEffect(() => {
    if (!mounted) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts on non-discover pages
      if (view !== "discover") return
      
      // Don't trigger shortcuts when user is typing in form inputs
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return
      }
      
      if (e.key === "ArrowLeft") {
        handleDislike()
      } else if (e.key === "ArrowRight") {
        handleLike()
      } else if (e.key === " ") {
        e.preventDefault()
        handleAddToCollection()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [mounted, view, handleDislike, handleLike, handleAddToCollection])

  const handleRemoveFromCollection = async (id: string) => {
    if (!user) {
      // Handle temporary collection removal
      const newCollection = collection.filter((item) => item.id !== id);
      setCollection(newCollection);
      saveTemporaryCollection(newCollection); // Persist to localStorage
      
      const removedArtwork = collection.find((item) => item.id === id);
      toast({
        title: "Removed from collection",
        description: removedArtwork ? `\"${removedArtwork.title}\" has been removed from your collection.` : "Artwork removed from collection.",
      });
      return;
    }

    try {
      // Remove from Supabase database
      const { error } = await supabase
        .from('Collection')
        .delete()
        .eq('user_id', user.id)
        .eq('artwork_id', Number(id));

      if (error) {
        console.error('Error removing from collection:', error);
        toast({
          title: "Error",
          description: "Failed to remove artwork from collection. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Update local state
      setDbCollection(prev => prev.filter((item) => item.id !== id));
      setCollection(prev => prev.filter((item) => item.id !== id));
      
      // Update collection count
      setCollectionCount(Math.max(0, collectionCount - 1));
      
      // Close any open modals and navigate back to collection view
      setSelectedCollectionArtwork(null);
      setView("collection");
      
      toast({
        title: "Removed from collection",
        description: "Artwork has been removed from your collection.",
      });
    } catch (error) {
      console.error('Error removing from collection:', error);
      toast({
        title: "Error",
        description: "Failed to remove artwork from collection. Please try again.",
        variant: "destructive",
      });
    }
  }

  const handleArtworkClick = (artwork: Artwork) => {
    const artworkIndex = dbCollection.findIndex(item => item.id === artwork.id);
    setCurrentDesktopCollectionIndex(artworkIndex);
    setSelectedCollectionArtwork(artwork);
  };

  // Desktop modal swipe handlers
  const handleDesktopModalTouchStart = (e: React.TouchEvent) => {
    if (isDesktopModalAnimating) return;
    
    const touch = e.touches[0];
    desktopModalStartX.current = touch.clientX;
    desktopModalStartY.current = touch.clientY;
    desktopModalIsDragging.current = true;
  };

  const handleDesktopModalTouchMove = (e: React.TouchEvent) => {
    if (!desktopModalIsDragging.current || isDesktopModalAnimating) return;
    
    const touch = e.touches[0];
    desktopModalCurrentX.current = touch.clientX - desktopModalStartX.current;
    const currentY = touch.clientY - desktopModalStartY.current;
    
    // Only handle horizontal swipes (ignore vertical scrolling)
    if (Math.abs(desktopModalCurrentX.current) > Math.abs(currentY) && Math.abs(desktopModalCurrentX.current) > 10) {
      e.preventDefault(); // Prevent vertical scrolling when swiping horizontally
      setDesktopModalSwipeDistance(desktopModalCurrentX.current);
    }
  };

  const handleDesktopModalTouchEnd = () => {
    if (!desktopModalIsDragging.current || isDesktopModalAnimating) return;
    
    desktopModalIsDragging.current = false;
    const distance = Math.abs(desktopModalCurrentX.current);
    
    if (distance > 100) {
      // Trigger navigation
      setIsDesktopModalAnimating(true);
      
      if (desktopModalCurrentX.current > 0) {
        // Swipe right - Go to previous artwork
        navigateToDesktopCollectionItem(currentDesktopCollectionIndex - 1);
      } else {
        // Swipe left - Go to next artwork
        navigateToDesktopCollectionItem(currentDesktopCollectionIndex + 1);
      }
      
      // Reset after animation
      setTimeout(() => {
        setDesktopModalSwipeDistance(0);
        setIsDesktopModalAnimating(false);
      }, 300);
    } else {
      // Snap back
      setDesktopModalSwipeDistance(0);
    }
    
    desktopModalCurrentX.current = 0;
  };

  const navigateToDesktopCollectionItem = (newIndex: number) => {
    if (newIndex < 0 || newIndex >= dbCollection.length) return;
    
    setCurrentDesktopCollectionIndex(newIndex);
    setSelectedCollectionArtwork(dbCollection[newIndex]);
  };

  const openImageOverlay = (url: string, alt: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
    }
    setOverlayImage({ url, alt })
  }

  const closeImageOverlay = () => {
    setOverlayImage(null)
  }

  const handleBuyClick = (artwork: Artwork, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
    }
    
    // Track lead analytics
    trackAnalytics(artwork.id, 'lead', user?.id);
    
    toast({
      title: "Coming Soon",
      description: `This will link to the purchase page for "${artwork.title}" on the artist's website.`,
    })
  }

  // Mobile-specific handlers that use the same logic as desktop
  const handleMobileNext = () => {
    const nextIndex = currentIndex === artworks.length - 1 ? 0 : currentIndex + 1;
    setCurrentIndex(nextIndex);
  };

  const handleMobileLike = async (artwork: Artwork) => {
    // Use the same logic as desktop handleLike, passing the artwork parameter
    await handleLike(artwork);
  };

  const handleMobileDislike = async (artwork: Artwork) => {
    // Use the same logic as desktop handleDislike, passing the artwork parameter
    await handleDislike(artwork);
  };

  const handleMobileAddToCollection = async (artwork: Artwork) => {
    // Use the same logic as desktop handleAddToCollection, passing the artwork parameter
    await handleAddToCollection(artwork);
  };

  // Desktop CardStack wrapper functions to match the expected interface
  const handleDesktopLike = async (artwork: Artwork) => {
    await handleLike(artwork);
  };

  const handleDesktopDislike = async (artwork: Artwork) => {
    await handleDislike(artwork);
  };

  const handleDesktopAddToCollection = async (artwork: Artwork) => {
    await handleAddToCollection(artwork);
  };

  // Add an effect to update currentArtwork when index changes
  useEffect(() => {
    
    // Track view analytics when artwork is displayed
    if (artworks[currentIndex]?.id) {
      trackAnalytics(artworks[currentIndex].id, 'view', user?.id);
    }
  }, [currentIndex, artworks])

  // Force a re-render when currentIndex changes
  useEffect(() => {
    if (currentIndex >= 0 && currentIndex < artworks.length) {
    }
  }, [currentIndex, artworks])

  // Handle selectedArtworkId - find and display the specific artwork
  useEffect(() => {
    if (selectedArtworkId) {
      // First, try to find in already loaded artworks (handle both string and number IDs)
      const artworkIndex = artworks.findIndex(artwork => 
        artwork.id === selectedArtworkId || 
        artwork.id === String(selectedArtworkId) || 
        String(artwork.id) === selectedArtworkId
      );
      
      if (artworkIndex !== -1) {
        console.log('✅ Found artwork in loaded list at index:', artworkIndex)
        setCurrentIndex(artworkIndex);
        // Ensure we're on discover view
        if (view !== 'discover') {
          setView('discover')
        }
      } else if (artworks.length > 0) {
        // Artwork not in loaded list, fetch it specifically
        console.log('🔍 Artwork not in loaded list, fetching specific artwork:', selectedArtworkId)
        fetchSpecificArtwork(selectedArtworkId)
      } else {
        // Artworks not loaded yet, wait for them to load
        console.log('⏳ Waiting for artworks to load before searching for:', selectedArtworkId)
      }
    }
  }, [selectedArtworkId, artworks, view, setView])

  // Fetch a specific artwork by ID
  const fetchSpecificArtwork = async (artworkId: string) => {
    try {
      console.log('🔍 Fetching artwork with ID:', artworkId)
      
      // Try as integer first (most common case)
      const artworkIdInt = parseInt(artworkId, 10)
      let artworkData = null
      let error = null
      
      if (!isNaN(artworkIdInt)) {
        const { data, error: err } = await supabase
          .from('Artwork')
          .select('*')
          .eq('id', artworkIdInt)
          .single()
        
        artworkData = data
        error = err
      }
      
      // If not found as integer or ID is not numeric, try as string
      if ((error && error.code === 'PGRST116') || !artworkData) {
        const { data: artworkDataStr, error: errorStr } = await supabase
          .from('Artwork')
          .select('*')
          .eq('id', artworkId)
          .single()
        
        if (errorStr && errorStr.code !== 'PGRST116') {
          console.error('❌ Artwork not found:', errorStr)
          return
        }
        
        if (artworkDataStr) {
          artworkData = artworkDataStr
        }
      }
      
      if (artworkData) {
        // Transform and add to artworks
        const transformedArtwork = transformArtworkData(artworkData)
        setArtworks([transformedArtwork])
        setCurrentIndex(0)
        setView('discover')
        console.log('✅ Artwork loaded and displayed:', transformedArtwork.title)
      } else {
        console.error('❌ Artwork not found with ID:', artworkId)
      }
    } catch (error) {
      console.error('❌ Error fetching specific artwork:', error)
    }
  }

  // Helper function to transform Supabase artwork data to Artwork interface
  const transformArtworkData = (artwork: any): Artwork => {
    return {
      id: String(artwork.id),
      title: artwork.artwork_title || '',
      artist: artwork.artist || '',
      medium: artwork.medium || '',
      dimensions: artwork.dimensions || '',
      year: artwork.year || '',
      price: artwork.price || '',
      currency: artwork.currency || undefined,
      description: artwork.description || '',
      tags: artwork.tags || [],
      artwork_image: artwork.artwork_image || '',
      created_at: artwork.created_at || '',
      updated_at: artwork.updated_at || '',
      link: artwork.artwork_link || artwork.link || undefined, // Map artwork_link to link
      style: artwork.style || undefined,
      genre: artwork.genre || undefined,
      subject: artwork.subject || undefined,
      colour: artwork.colour || undefined,
    }
  }


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    
    if (name === 'portfolioLink') {
      // Remove any existing protocol
      let cleanUrl = value.replace(/^(https?:\/\/)/, '')
      
      // If the user is typing a domain (contains at least one dot)
      if (cleanUrl.includes('.')) {
        // Add https:// if not already present
        const finalUrl = cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`
        setFormData(prev => ({
          ...prev,
          [name]: finalUrl
        }))
      } else {
        // During initial typing, before the user adds a domain
        setFormData(prev => ({
          ...prev,
          [name]: value
        }))
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const validatePortfolioUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.email || !formData.portfolioLink) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    if (!validatePortfolioUrl(formData.portfolioLink)) {
      toast({
        title: "Error",
        description: "Please enter a valid URL starting with http:// or https://",
        variant: "destructive"
      })
      return
    }
    
    try {
      console.log('Submitting form with data:', formData)

      // Send email using EmailJS
      const response = await sendArtistSubmission(formData)
      console.log('EmailJS response:', response)

      // Show success message
      toast({
        title: "Thank you!",
        description: "Our curators will review your portfolio and get back to you within a few days.",
        variant: "default"
      })
      
      // Reset form
      setFormData({
        name: "",
        email: "",
        portfolioLink: "",
        message: ""
      })
    } catch (error) {
      console.error('Error submitting form:', error)
      let errorMessage = 'There was an error submitting your form. Please try again.'
      
      if (error instanceof Error) {
        errorMessage = error.message
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
    }
  }

  // Show overlay if all artworks in the current list have been viewed
  useEffect(() => {
    if (artworks.length > 0) {
      const allViewed = artworks.every(a => localPreferences.viewed_artworks.includes(a.id));
      if (allViewed && !showEndOfMatchesOverlay) {
        setShowEndOfMatchesOverlay(true);
      }
      // Clamp currentIndex
      if (currentIndex >= artworks.length) {
        setCurrentIndex(artworks.length - 1);
      }
    }
  }, [artworks, localPreferences, currentIndex, showEndOfMatchesOverlay]);

  // Fetch user's collection from Collection table
  async function fetchUserCollection() {
    if (!user) return;
    const { data: collectionRows, error: collectionError } = await supabase
      .from('Collection')
      .select('artwork_id')
      .eq('user_id', user.id);
    if (collectionError) return;
    const artworkIds = collectionRows?.map(row => row.artwork_id) || [];
    if (artworkIds.length === 0) {
      setDbCollection([]);
      return;
    }
    const { data: artworks, error: artworkError } = await supabase
      .from('Artwork')
      .select('*')
      .in('id', artworkIds);
    if (!artworkError && artworks) setDbCollection(artworks);
  }

  // Call fetchUserCollection on mount and after add/remove
  useEffect(() => { fetchUserCollection(); }, [user]);

  const [isAnimating, setIsAnimating] = useState(false)
  const [actionFeedback, setActionFeedback] = useState<{
    type: 'like' | 'dislike' | 'add' | null;
    show: boolean;
  }>({ type: null, show: false });
  
  // Desktop collection modal swipe state
  const [currentDesktopCollectionIndex, setCurrentDesktopCollectionIndex] = useState(0);
  const desktopModalStartX = useRef<number>(0);
  const desktopModalStartY = useRef<number>(0);
  const desktopModalCurrentX = useRef<number>(0);
  const desktopModalIsDragging = useRef<boolean>(false);
  const [desktopModalSwipeDistance, setDesktopModalSwipeDistance] = useState(0);
  const [isDesktopModalAnimating, setIsDesktopModalAnimating] = useState(false);

  // Helper function to track analytics (temporarily disabled due to API errors)
  const trackAnalytics = async (artworkId: string, action: 'view' | 'lead' | 'like' | 'dislike' | 'add_to_collection', userId?: string) => {
    // Temporarily disabled to prevent 500 errors
    console.log(`Analytics tracking disabled: ${action} for artwork ${artworkId}`)
    return
    
    try {
      await fetch('/api/artwork-analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          artwork_id: artworkId,
          action,
          user_id: userId,
        }),
      })
    } catch (error) {
      console.error('Failed to track analytics:', error)
      // Don't throw error as analytics shouldn't break user experience
    }
  }

  // Removed emergency fallback - let the app load naturally

  // Show loading only if we have no artworks and are still loading
  if (!mounted || (loading && artworks.length === 0)) {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            {isMobile ? (
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="flex items-center justify-center">
                  <img 
                    src="/logos/logo-medium-48x48.svg" 
                    alt="Kaleidorium Logo" 
                    className="w-6 h-6 mr-2"
                  />
                  <h1 className="text-lg font-serif font-bold text-black">Kaleidorium</h1>
                </div>
                <p className="text-lg text-black text-center">Your Personal Art Curator</p>
                <p className="text-lg text-black text-center">Loading Artwork...</p>
                {loadingError && (
                  <div className="mt-4">
                    <p className="text-red-600 mb-2">{loadingError}</p>
                    <div className="space-y-2">
                      <Button 
                        onClick={() => {
                          setLoadingError(null);
                          fetchingRef.current = false;
                          setLoading(false);
                          fetchArtworks();
                        }}
                        variant="outline"
                        className="mr-2"
                      >
                        Try Again
                      </Button>
                      <Button 
                        onClick={() => {
                          setLoading(false);
                          window.location.reload();
                        }}
                        variant="outline"
                      >
                        Refresh Page
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-center mb-4">
                  <img 
                    src="/logos/logo-desktop-32x32.svg" 
                    alt="Kaleidorium Logo" 
                    className="w-8 h-8 mr-3"
                  />
                  <div className="text-black text-xl">Loading Artwork...</div>
                </div>
                {loadingError && (
                  <div className="mt-4">
                    <p className="text-red-600 mb-2">{loadingError}</p>
                    <div className="space-y-2">
                      <Button 
                        onClick={() => {
                          setLoadingError(null);
                          fetchingRef.current = false;
                          setLoading(false);
                          fetchArtworks();
                        }}
                        variant="outline"
                        className="mr-2"
                      >
                        Try Again
                      </Button>
                      <Button 
                        onClick={() => {
                          setLoading(false);
                          window.location.reload();
                        }}
                        variant="outline"
                      >
                        Refresh Page
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // If there are no artworks at all in the database
  if (artworks.length === 0) {
    return (
      <div className="flex flex-col min-h-screen">
        <main className="flex-1 flex flex-col items-center justify-center">
          <div className="text-lg text-muted-foreground">No artworks available</div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">      
      {/* Auth Modal */}
      {showAuthModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowAuthModal(false)}
        >
          <div
            className="bg-white p-6 rounded-lg max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-medium">Create an Account</h2>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10"
                onClick={() => setShowAuthModal(false)}
              >
                <X className="h-6 w-6" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
            <div className="text-center mb-6">
              <p className="text-muted-foreground mb-4">
                Create an account to:
              </p>
              <ul className="text-left space-y-2 mb-6">
                <li className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-green-500" />
                  Save your preferences and get personalized recommendations
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-green-500" />
                  Build and manage your art collection
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-green-500" />
                  Access exclusive features and content
                </li>
              </ul>
              <Button
                className="w-full mb-4"
                onClick={() => {
                  setShowAuthModal(false)
                  router.push('/register')
                }}
              >
                Create Account
              </Button>
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Button
                  variant="link"
                  className="p-0 h-auto font-normal"
                  onClick={() => {
                    setShowAuthModal(false)
                    router.push('/login')
                  }}
                >
                  Sign in
                </Button>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Image Overlay */}
      {overlayImage && <ImageOverlay artwork_image={overlayImage.url} alt={overlayImage.alt} onClose={closeImageOverlay} />}

      {view === "discover" ? (
        // Mobile vs Desktop conditional rendering
        isMobile || isTablet ? (
          <MobileArtDiscovery
            artworks={artworks}
            currentIndex={currentIndex}
            onNext={handleMobileNext}
            onLike={handleMobileLike}
            onDislike={handleMobileDislike}
            onAddToCollection={handleMobileAddToCollection}
            onLoadMore={loadMoreArtworks}
            setView={setView}
            view={view}
            collection={dbCollection}
            onRemoveFromCollection={handleRemoveFromCollection}
            onFilterChange={handleMobileFilterChange}
            onClearFilters={clearFilters}
            showFallbackMessage={showFallbackMessage}
            isLandscape={isLandscape}
            isPortrait={isPortrait}
            screenWidth={screenWidth}
            screenHeight={screenHeight}
          />
        ) : (currentArtwork || (isFiltering && currentArtworkList.length === 0)) ? (
          <>
            <CardStack
              artworks={currentArtworkList}
              currentIndex={currentIndex}
              onLike={handleDesktopLike}
              onDislike={handleDesktopDislike}
              onAddToCollection={handleDesktopAddToCollection}
              onNext={handleNext}
              onLoadMore={loadMoreArtworks}
              onImageClick={openImageOverlay}
              loading={loading || isSearching}
              showFallbackMessage={showFallbackMessage}
            />

            {/* Desktop Filter Panel */}
            {showDesktopFilters && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto m-4">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-black">Filters</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDesktopFilters(false)}
                    className="text-black hover:bg-gray-100"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                
                {/* Search Field - Full Width */}
                <div className="mb-6">
                  <label className="block text-sm font-bold text-black mb-2">Search</label>
                  <Input
                    placeholder="Search by artwork title or artist name (e.g. Cool it down, Lisawong)..."
                    value={activeFilters.search || ''}
                    onChange={(e) => {
                      const newFilters = { ...activeFilters, search: e.target.value }
                      setActiveFilters(newFilters)
                    }}
                    onKeyDown={(e) => {
                      // Prevent form submission on Enter
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        e.stopPropagation()
                        // Auto-apply filters when Enter is pressed
                        if (activeFilters.search?.trim()) {
                          handleFilterChange(activeFilters)
                          setShowDesktopFilters(false)
                        }
                      }
                    }}
                    className="w-full"
                  />
                  {activeFilters.search && (
                    <p className="text-xs text-gray-500 mt-1">
                      Press Enter to search, or click "Apply Filters" below
                    </p>
                  )}
                </div>
                
                <div className="space-y-6">
                  {/* Style Filter */}
                  <div className="relative">
                    <label className="block text-sm font-bold mb-2">Style</label>
                    
                    {/* Selected tags display */}
                    {activeFilters.style && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {activeFilters.style.split(',').map((tag) => (
                          <span
                            key={tag.trim()}
                            className="inline-flex items-center px-2 py-1 rounded-md bg-blue-100 text-blue-800 text-xs cursor-pointer hover:bg-red-100"
                            onClick={() => {
                              const newFilters = { ...activeFilters }
                              newFilters.style = newFilters.style.replace(tag.trim(), '').replace(/,\s*,/g, ',').replace(/^,|,$/g, '')
                              setActiveFilters(newFilters)
                            }}
                          >
                            {tag.trim()} ×
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <Input
                      type="text"
                      placeholder="e.g. Abstract, Portrait, Digital Art..."
                      value={activeFilters.style}
                      onChange={(e) => {
                        const newFilters = { ...activeFilters }
                        newFilters.style = e.target.value
                        setActiveFilters(newFilters)
                      }}
                      className="mb-2"
                    />
                    
                    {/* Quick select buttons */}
                    <div className="flex flex-wrap gap-2">
                      {['Digital Art', 'Abstract', 'Portrait', 'Contemporary', 'Modern', 'Realism', 'Impressionism', 'Cubism', 'Surrealism', 'Minimalism'].map((tag) => (
                        <Button
                          key={tag}
                          variant="outline"
                          size="sm"
                          className={`text-xs ${activeFilters.style.includes(tag) ? 'bg-blue-100 border-blue-300' : ''}`}
                          onClick={() => {
                            const newFilters = { ...activeFilters }
                            if (newFilters.style.includes(tag)) {
                              newFilters.style = newFilters.style.replace(tag, '').replace(/,\s*,/g, ',').replace(/^,|,$/g, '')
                            } else {
                              newFilters.style = newFilters.style ? `${newFilters.style}, ${tag}` : tag
                            }
                            setActiveFilters(newFilters)
                          }}
                        >
                          {tag}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Subject Filter */}
                  <div className="relative">
                    <label className="block text-sm font-bold mb-2">Subject</label>
                    
                    {/* Selected tags display */}
                    {activeFilters.subject && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {activeFilters.subject.split(',').map((tag) => (
                          <span
                            key={tag.trim()}
                            className="inline-flex items-center px-2 py-1 rounded-md bg-blue-100 text-blue-800 text-xs cursor-pointer hover:bg-red-100"
                            onClick={() => {
                              const newFilters = { ...activeFilters }
                              newFilters.subject = newFilters.subject.replace(tag.trim(), '').replace(/,\s*,/g, ',').replace(/^,|,$/g, '')
                              setActiveFilters(newFilters)
                            }}
                          >
                            {tag.trim()} ×
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <Input
                      type="text"
                      placeholder="e.g. Nature, Urban, Portrait..."
                      value={activeFilters.subject}
                      onChange={(e) => {
                        const newFilters = { ...activeFilters }
                        newFilters.subject = e.target.value
                        setActiveFilters(newFilters)
                      }}
                      className="mb-2"
                    />
                    
                    {/* Quick select buttons */}
                    <div className="flex flex-wrap gap-2">
                      {['Nature', 'Urban', 'Portrait', 'Abstract', 'Landscape', 'Still Life', 'Architecture', 'Animals', 'People', 'City'].map((tag) => (
                        <Button
                          key={tag}
                          variant="outline"
                          size="sm"
                          className={`text-xs ${activeFilters.subject.includes(tag) ? 'bg-blue-100 border-blue-300' : ''}`}
                          onClick={() => {
                            const newFilters = { ...activeFilters }
                            if (newFilters.subject.includes(tag)) {
                              newFilters.subject = newFilters.subject.replace(tag, '').replace(/,\s*,/g, ',').replace(/^,|,$/g, '')
                            } else {
                              newFilters.subject = newFilters.subject ? `${newFilters.subject}, ${tag}` : tag
                            }
                            setActiveFilters(newFilters)
                          }}
                        >
                          {tag}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Colors Filter */}
                  <div className="relative">
                    <label className="block text-sm font-bold mb-2">Colors</label>
                    
                    {/* Selected tags display */}
                    {activeFilters.colors && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {activeFilters.colors.split(',').map((tag) => (
                          <span
                            key={tag.trim()}
                            className="inline-flex items-center px-2 py-1 rounded-md bg-blue-100 text-blue-800 text-xs cursor-pointer hover:bg-red-100"
                            onClick={() => {
                              const newFilters = { ...activeFilters }
                              newFilters.colors = newFilters.colors.replace(tag.trim(), '').replace(/,\s*,/g, ',').replace(/^,|,$/g, '')
                              setActiveFilters(newFilters)
                            }}
                          >
                            {tag.trim()} ×
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <Input
                      type="text"
                      placeholder="e.g. Black, Colorful, Warm tones..."
                      value={activeFilters.colors}
                      onChange={(e) => {
                        const newFilters = { ...activeFilters }
                        newFilters.colors = e.target.value
                        setActiveFilters(newFilters)
                      }}
                      className="mb-2"
                    />
                    
                    {/* Quick select buttons */}
                    <div className="flex flex-wrap gap-2">
                      {['Black', 'White', 'Colorful', 'Monochrome', 'Blue', 'Red', 'Green', 'Yellow', 'Purple', 'Warm tones', 'Cool tones'].map((tag) => (
                        <Button
                          key={tag}
                          variant="outline"
                          size="sm"
                          className={`text-xs ${activeFilters.colors.includes(tag) ? 'bg-blue-100 border-blue-300' : ''}`}
                          onClick={() => {
                            const newFilters = { ...activeFilters }
                            if (newFilters.colors.includes(tag)) {
                              newFilters.colors = newFilters.colors.replace(tag, '').replace(/,\s*,/g, ',').replace(/^,|,$/g, '')
                            } else {
                              newFilters.colors = newFilters.colors ? `${newFilters.colors}, ${tag}` : tag
                            }
                            setActiveFilters(newFilters)
                          }}
                        >
                          {tag}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Filter Action Buttons */}
                <div className="flex justify-center gap-4 mt-6">
                  <Button 
                    onClick={() => {
                      handleFilterChange(activeFilters)
                      setShowDesktopFilters(false)
                    }}
                    className="px-6"
                  >
                    Apply Filters
                  </Button>
                  {isFiltering && (
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        clearFilters()
                        setShowDesktopFilters(false)
                      }}
                      className="px-6"
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
            )}
          </>
        ) : null
      ) : view === "collection" ? (
        isMobile || isTablet ? (
          // Mobile Collection Page with Header
          <div className="fixed inset-0 bg-white z-50 flex flex-col">
            <NewMobileHeader currentPage="collection" collectionCount={collectionCount} setView={(view) => {
              if (["discover", "collection", "profile", "for-artists"].includes(view)) {
                setView(view as "discover" | "collection" | "profile" | "for-artists");
              }
            }} />
            
            {/* Mobile Collection Content */}
            <div className="flex-1 overflow-y-auto p-4 pt-20">
              <div className="mb-6 flex flex-col justify-between items-start gap-4">
                <h2 className="text-base font-serif font-bold text-black" style={{fontSize: '14px', fontFamily: 'Times New Roman, serif'}}>My Collection ({(user ? dbCollection : collection).length})</h2>
                <Button onClick={() => setView("discover")}>Return to Discovery</Button>
              </div>

              {!user && collection.length > 0 && (
                <div
                  className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg text-blue-900 flex flex-col items-start gap-3 font-sans shadow-sm"
                  style={{ fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, \"Noto Sans\", sans-serif' }}
                >
                  <div className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold">Save Your Collection!</span>
                  </div>
                  <span className="text-sm">
                    You've collected {collection.length} artwork{collection.length !== 1 ? 's' : ''}! Register now to save your collection permanently and get personalized recommendations.
                  </span>
                  <div className="flex gap-2">
                    <Button onClick={() => router.push('/register')} variant="default" size="sm">
                      Register Now
                    </Button>
                    <Button onClick={() => router.push('/login')} variant="outline" size="sm">
                      Sign In
                    </Button>
                  </div>
                </div>
              )}
              
              {!user && collection.length === 0 && (
                <div
                  className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded text-yellow-900 flex flex-col items-start gap-2 font-sans"
                  style={{ fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, \"Noto Sans\", sans-serif' }}
                >
                  <span>Register to save your collection and preferences as you discover art.</span>
                  <Button onClick={() => router.push('/register')} variant="default" size="sm">Register</Button>
                </div>
              )}
              {(user ? dbCollection.length === 0 : collection.length === 0) ? (
                <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 mb-6 rounded-full bg-muted flex items-center justify-center">
                    <Heart className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-medium mb-2">Your collection is empty</h3>
                  <p className="text-muted-foreground max-w-md mb-6 text-sm sm:text-base">
                    Start exploring Kaleidorium's curated selection of artwork and add pieces you love to your collection.
                  </p>
                  <Button onClick={() => setView("discover")}>Discover Artwork</Button>
                </div>
              ) : selectedCollectionArtwork ? (
                // Mobile detailed view of selected artwork
                <div className="flex flex-col gap-6">
                  <div>
                    <Button variant="ghost" onClick={() => setSelectedCollectionArtwork(null)} className="mb-4">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Collection
                    </Button>
                  </div>
                  <div
                    className="relative cursor-zoom-in rounded-2xl overflow-hidden"
                    style={{ aspectRatio: '4/3' }}
                    onClick={() => openImageOverlay(selectedCollectionArtwork.artwork_image, selectedCollectionArtwork.title)}
                  >
                    <img
                      src={selectedCollectionArtwork.artwork_image || "/placeholder.svg"}
                      alt={selectedCollectionArtwork.title}
                      className="object-contain p-4"
                      style={{ objectFit: 'contain', width: '100%', height: '100%' }}
                    />
                  </div>
                  <div className="flex flex-col gap-3">
                    <Tooltip content={selectedCollectionArtwork?.link ? "You will be redirected to the artwork page on the artist's website." : "No artwork URL provided."}>
                      <span>
                        <Button
                          variant="default"
                          size="lg"
                          asChild={!!selectedCollectionArtwork?.link}
                          disabled={!selectedCollectionArtwork?.link}
                          className={!selectedCollectionArtwork?.link ? "cursor-not-allowed opacity-60" : ""}
                          onClick={() => {
                            if (selectedCollectionArtwork?.link) {
                              window.open(selectedCollectionArtwork.link, '_blank', 'noopener,noreferrer')
                            }
                          }}
                        >
                          View Artwork Page
                        </Button>
                      </span>
                    </Tooltip>
                  </div>
                  <div className="bg-background rounded-lg">
                    <ArtworkDetails artwork={selectedCollectionArtwork} showShareButton={true} />
                  </div>
                  <div className="mt-4">
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => {
                        if (selectedCollectionArtwork && selectedCollectionArtwork.id) {
                          handleRemoveFromCollection(selectedCollectionArtwork.id)
                        }
                        setSelectedCollectionArtwork(null)
                      }}
                    >
                      <Trash className="mr-2 h-4 w-4" />
                      Remove from Collection
                    </Button>
                  </div>
                </div>
              ) : (
                // Enhanced mobile masonry view of collection
                <div className="columns-1 sm:columns-2 gap-4 space-y-4">
                  {(user ? dbCollection : collection).map((artwork, index) => (
                    <Card
                      key={artwork.id}
                      className="overflow-hidden group cursor-pointer break-inside-avoid mb-4 
                        shadow-elegant hover:shadow-elegant-hover transition-all duration-300 
                        hover:scale-[1.02] border-0 bg-white/90 backdrop-blur-sm artwork-card"
                      onClick={() => setSelectedCollectionArtwork(artwork)}
                      style={{
                        animationDelay: `${index * 50}ms`,
                        animation: 'fadeInUp 0.6s ease-out forwards'
                      }}
                    >
                      <div className="relative rounded-2xl overflow-hidden group-hover:rounded-xl transition-all duration-300">
                        <ProgressiveImage
                          src={artwork.artwork_image || "/placeholder.svg"}
                          alt={artwork.title}
                          className="w-full h-auto transition-all duration-500 group-hover:scale-105"
                          style={{ 
                            minHeight: '150px',
                            maxHeight: '400px'
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent 
                          opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center pb-4">
                          <div className="flex gap-3 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                            <Button
                              variant="secondary"
                              size="sm"
                              className="backdrop-blur-md bg-white/90 hover:bg-white text-black shadow-lg button-bounce"
                              onClick={(e) => {
                                e.stopPropagation()
                                openImageOverlay(artwork.artwork_image, artwork.title)
                              }}
                            >
                              View
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="backdrop-blur-md bg-red-500/90 hover:bg-red-600 shadow-lg button-bounce"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRemoveFromCollection(artwork.id)
                              }}
                            >
                              <Trash className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex justify-between items-start gap-2">
                          <Button
                            variant="ghost"
                            size="lg"
                            className="flex items-center gap-3 p-3 h-auto justify-start flex-1 min-h-[60px]"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleArtworkClick(artwork)
                            }}
                          >
                            <Info className="h-8 w-8 flex-shrink-0" />
                            <div className="text-left">
                              <h3 className="font-medium font-serif text-base sm:text-lg">{artwork.title}</h3>
                            </div>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          // Desktop Collection Page
          <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-base font-serif font-bold text-black" style={{fontSize: '14px', fontFamily: 'Times New Roman, serif'}}>My Collection ({(user ? dbCollection : collection).length})</h2>
              <Button onClick={() => setView("discover")}>Return to Discovery</Button>
            </div>

            {!user && collection.length > 0 && (
              <div
                className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg text-blue-900 flex flex-col items-start gap-3 font-sans shadow-sm"
                style={{ fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, \"Noto Sans\", sans-serif' }}
              >
                <div className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold">Save Your Collection!</span>
                </div>
                <span className="text-sm" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>
                  You've collected {collection.length} artwork{collection.length !== 1 ? 's' : ''}! Register now to save your collection permanently and get personalized recommendations.
                </span>
                <div className="flex gap-2">
                  <Button onClick={() => router.push('/register')} variant="default" size="sm">
                    Register Now
                  </Button>
                  <Button onClick={() => router.push('/login')} variant="outline" size="sm">
                    Sign In
                  </Button>
                </div>
              </div>
            )}
            
            {!user && collection.length === 0 && (
              <div
                className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded text-yellow-900 flex flex-col items-start gap-2 font-sans"
                style={{ fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, \"Noto Sans\", sans-serif' }}
              >
                <span style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>Register to save your collection and preferences as you discover art.</span>
                <Button onClick={() => router.push('/register')} variant="default" size="sm" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>Register</Button>
              </div>
            )}
            {(user ? dbCollection.length === 0 : collection.length === 0) ? (
              <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
                <div className="w-20 h-20 sm:w-24 sm:h-24 mb-6 rounded-full bg-muted flex items-center justify-center">
                  <Heart className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg sm:text-xl font-medium mb-2" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>Your collection is empty</h3>
                <p className="text-muted-foreground max-w-md mb-6 text-sm sm:text-base" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>
                  Start exploring Kaleidorium's curated selection of artwork and add pieces you love to your collection.
                </p>
                <Button onClick={() => setView("discover")} style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>Discover Artwork</Button>
              </div>
            ) : selectedCollectionArtwork ? (
              // Desktop detailed view of selected artwork
              <div 
                className="flex flex-col lg:flex-row gap-6 lg:gap-8 collection-modal-swipe swipe-container"
                onTouchStart={handleDesktopModalTouchStart}
                onTouchMove={handleDesktopModalTouchMove}
                onTouchEnd={handleDesktopModalTouchEnd}
                style={{
                  transform: `translateX(${desktopModalSwipeDistance}px)`,
                  transition: isDesktopModalAnimating ? 'transform 0.3s ease-out' : 'none'
                }}
              >
                <div className="lg:w-2/3">
                  <div className="mb-4 flex justify-between items-center">
                    <Button variant="ghost" onClick={() => setSelectedCollectionArtwork(null)} className="mb-4">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Collection
                    </Button>
                    
                    {/* Position indicator */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">
                        {currentDesktopCollectionIndex + 1} of {(user ? dbCollection : collection).length}
                      </span>
                      <div className="flex gap-1">
                        {(user ? dbCollection : collection).map((_, index) => (
                          <div
                            key={index}
                            className={`w-2 h-2 rounded-full transition-colors ${
                              index === currentDesktopCollectionIndex ? 'bg-blue-500' : 'bg-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>


                  
                  <div
                    className="relative cursor-zoom-in rounded-2xl overflow-hidden"
                    style={{ aspectRatio: '4/3' }}
                    onClick={() => openImageOverlay(selectedCollectionArtwork.artwork_image, selectedCollectionArtwork.title)}
                  >
                    <img
                      src={selectedCollectionArtwork.artwork_image || "/placeholder.svg"}
                      alt={selectedCollectionArtwork.title}
                      className="object-contain p-4"
                      style={{ objectFit: 'contain', width: '100%', height: '100%' }}
                    />
                  </div>
                  
                  <div className="mt-4 flex flex-col sm:flex-row gap-3 sm:gap-4 sm:justify-between">
                    {/* Navigation buttons */}
                    <div className="flex gap-2">
                      {currentDesktopCollectionIndex > 0 && (
                        <Button
                          variant="outline"
                          onClick={() => navigateToDesktopCollectionItem(currentDesktopCollectionIndex - 1)}
                          className="text-sm"
                        >
                          ← Previous
                        </Button>
                      )}
                      {currentDesktopCollectionIndex < (user ? dbCollection : collection).length - 1 && (
                        <Button
                          variant="outline"
                          onClick={() => navigateToDesktopCollectionItem(currentDesktopCollectionIndex + 1)}
                          className="text-sm"
                        >
                          Next →
                        </Button>
                      )}
                    </div>
                    
                    <div className="flex gap-3">
                      <Button
                        variant="destructive"
                        onClick={() => {
                          if (selectedCollectionArtwork && selectedCollectionArtwork.id) {
                            handleRemoveFromCollection(selectedCollectionArtwork.id)
                            // Adjust index if we removed the last item
                            if (currentDesktopCollectionIndex >= (user ? dbCollection : collection).length - 1) {
                              setCurrentDesktopCollectionIndex(Math.max(0, (user ? dbCollection : collection).length - 2));
                            }
                            // Close modal if collection becomes empty
                            if ((user ? dbCollection : collection).length <= 1) {
                              setSelectedCollectionArtwork(null);
                            }
                          }
                        }}
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        Remove from Collection
                      </Button>
                      <Tooltip content={selectedCollectionArtwork?.link ? "You will be redirected to the artwork page on the artist's website." : "No artwork URL provided."}>
                        <span>
                          <Button
                            variant="default"
                            size="lg"
                            asChild={!!selectedCollectionArtwork?.link}
                            disabled={!selectedCollectionArtwork?.link}
                            className={!selectedCollectionArtwork?.link ? "cursor-not-allowed opacity-60" : ""}
                            onClick={() => {
                              if (selectedCollectionArtwork?.link) {
                                window.open(selectedCollectionArtwork.link, '_blank', 'noopener,noreferrer')
                              }
                            }}
                          >
                            View Artwork Page
                          </Button>
                        </span>
                      </Tooltip>
                    </div>
                  </div>
                </div>
                <div className="lg:w-1/3 bg-background rounded-lg">
                  <ArtworkDetails artwork={selectedCollectionArtwork} showShareButton={true} />
                </div>
              </div>
            ) : (
              // Enhanced masonry/Pinterest-style grid for collection
              <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 sm:gap-6 space-y-4 sm:space-y-6">
                {(user ? dbCollection : collection).map((artwork, index) => (
                  <Card
                    key={artwork.id}
                    className="overflow-hidden group cursor-pointer break-inside-avoid mb-4 sm:mb-6 
                      shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02] 
                      border-0 bg-white/80 backdrop-blur-sm"
                    onClick={() => handleArtworkClick(artwork)}
                    style={{
                      animationDelay: `${index * 50}ms`,
                      animation: 'fadeInUp 0.6s ease-out forwards'
                    }}
                  >
                    <div className="relative rounded-2xl overflow-hidden group-hover:rounded-xl transition-all duration-300">
                      <ProgressiveImage
                        src={artwork.artwork_image || "/placeholder.svg"}
                        alt={artwork.title}
                        className="w-full h-auto transition-all duration-500 group-hover:scale-105 artwork-card"
                        style={{ 
                          minHeight: '200px',
                          maxHeight: '500px'
                        }}
                        onClick={() => handleArtworkClick(artwork)}
                      />
                      
                      {/* Enhanced hover overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent 
                        opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center pb-4">
                        <div className="flex gap-3 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="backdrop-blur-md bg-white/90 hover:bg-white text-black shadow-lg"
                            onClick={(e) => {
                              e.stopPropagation()
                              openImageOverlay(artwork.artwork_image, artwork.title)
                            }}
                          >
                            View
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="backdrop-blur-md bg-red-500/90 hover:bg-red-600 shadow-lg"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRemoveFromCollection(artwork.id)
                            }}
                          >
                            <Trash className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <h3 className="font-medium font-serif text-base sm:text-lg truncate" style={{fontSize: '14px', fontFamily: 'Times New Roman, serif'}}>{artwork.title}</h3>
                          <ArtistNameWithBadge 
                            artistName={artwork.artist}
                            artistId={(artwork as any).artist_id}
                            className="text-xs sm:text-sm text-muted-foreground truncate"
                          />
                        </div>
                        <Tooltip content={artwork.link ? "You will be redirected to the artwork page on the artist's website." : "No artwork URL provided."}>
                          <span>
                            <Button size="sm" className="shrink-0" onClick={(e) => handleBuyClick(artwork, e)}>
                              View Artwork Page
                            </Button>
                          </span>
                        </Tooltip>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )
      ) : view === "for-artists" ? (
        isMobile || isTablet ? (
          // Mobile For Artists Content - let main app handle header
          <div className="for-artists-page" data-view="for-artists">
            {/* Hero Section */}
            <div className="bg-gradient-to-br from-gray-50 to-white py-8 px-4">
              <div className="max-w-3xl mx-auto">
                <h1 
                  className="text-xl font-serif font-bold text-black mb-4"
                  style={{fontFamily: 'Times New Roman, serif'}}
                >
                  Be Discovered. Not Buried.
                </h1>
                <p className="text-sm font-sans text-black mb-3 leading-relaxed" style={{fontFamily: 'Arial, sans-serif'}}>
                  You put time, soul, and skill into your work. Only for it to disappear in endless scrolls and overcrowded marketplaces. Kaleidorium changes that.
                </p>
                <p className="text-xs font-sans text-black mb-3" style={{fontFamily: 'Arial, sans-serif'}}>
                  We're not a gallery, marketplace, or agent.
                </p>
                <p className="text-xs font-sans text-black mb-4" style={{fontFamily: 'Arial, sans-serif'}}>
                  We're a new kind of discovery platform, powered by AI and built to match your artwork with the right eyes.
                </p>
                
                {/* Compact Artwork Grid */}
                <div className="bg-gray-100 rounded-lg p-3 mb-6">
                  <p className="text-xs font-sans text-gray-600 text-center mb-3" style={{fontFamily: 'Arial, sans-serif'}}>
                    Your art finds its perfect audience
                  </p>
                  <div className="grid grid-cols-3 gap-1.5">
                    <div className="aspect-square bg-white rounded overflow-hidden shadow-sm">
                      <img 
                        src="/Onboarding-images/For Collectors/Hennie_3__The_Visitor___120x100cm__Oil__1754903123908.jpg"
                        alt="Artwork 1"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="aspect-square bg-white rounded overflow-hidden shadow-sm">
                      <img 
                        src="/Onboarding-images/For Collectors/Josignacio_4_Josignacio_s_Rhapsody_Blue_1754903114939.jpg"
                        alt="Artwork 2"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="aspect-square bg-white rounded overflow-hidden shadow-sm">
                      <img 
                        src="/Onboarding-images/For Collectors/Peterson_5_Isometric_Pixel_Art_by_Peterso_1754903119020.gif"
                        alt="Artwork 3"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="aspect-square bg-white rounded overflow-hidden shadow-sm">
                      <img 
                        src="/Onboarding-images/For Collectors/Steampunk3_1755249065054.png"
                        alt="Artwork 4"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="aspect-square bg-white rounded overflow-hidden shadow-sm">
                      <img 
                        src="/Onboarding-images/For Collectors/Theo_3_677_To_Theo_van_Gogh__Arles__S_1754903144275.jpg"
                        alt="Artwork 5"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="aspect-square bg-white rounded overflow-hidden shadow-sm">
                      <img 
                        src="/Onboarding-images/For Collectors/xcopy_2_XCOPY_LAST_SELFIE_4K.gif"
                        alt="Artwork 6"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>
                
                {/* CTA Button */}
                <Button 
                  onClick={() => document.getElementById('mobile-portfolio-form')?.scrollIntoView({ behavior: 'smooth' })}
                  className="w-full bg-black text-white hover:bg-gray-800 py-2 text-sm font-medium mb-4"
                  style={{fontFamily: 'Arial, sans-serif'}}
                >
                  Join the Founding 100 Artists
                </Button>
              </div>
            </div>

              {/* How It Works Section */}
              <div className="py-8 px-4 bg-white">
                <div className="max-w-3xl mx-auto">
                  <h2 
                    className="text-lg font-serif font-bold text-black text-center mb-6"
                    style={{fontFamily: 'Times New Roman, serif'}}
                  >
                    How It Works
                  </h2>
                  <div className="space-y-6">
                    {/* Step 1 */}
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-sm font-sans font-bold text-black mb-1" style={{fontFamily: 'Arial, sans-serif'}}>
                          Upload Your Artwork
                        </h3>
                        <p className="text-xs font-sans text-gray-600 leading-relaxed" style={{fontFamily: 'Arial, sans-serif'}}>
                          Upload a picture of your artwork and link to your own site. Simple and straightforward.
                        </p>
                      </div>
                    </div>
                    
                    {/* Step 2 */}
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-sm font-sans font-bold text-black mb-1" style={{fontFamily: 'Arial, sans-serif'}}>
                          AI matches you with collectors
                        </h3>
                        <p className="text-xs font-sans text-gray-600 leading-relaxed" style={{fontFamily: 'Arial, sans-serif'}}>
                          Our AI analyzes your visual signature and matches it with collectors who will love your style.
                        </p>
                      </div>
                    </div>
                    
                    {/* Step 3 */}
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-sm font-sans font-bold text-black mb-1" style={{fontFamily: 'Arial, sans-serif'}}>
                          Track Performance
                        </h3>
                        <p className="text-xs font-sans text-gray-600 leading-relaxed" style={{fontFamily: 'Arial, sans-serif'}}>
                          See how your art performs: likes, saves, and collector engagement with detailed analytics.
                        </p>
                      </div>
                    </div>
                    
                    {/* Step 4 */}
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-sm font-sans font-bold text-black mb-1" style={{fontFamily: 'Arial, sans-serif'}}>
                          Stay in Control
                        </h3>
                        <p className="text-xs font-sans text-gray-600 leading-relaxed" style={{fontFamily: 'Arial, sans-serif'}}>
                          You keep full control. No commissions. No middlemen. No gatekeeping.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Founding 100 Section */}
              <div className="py-8 px-4 bg-gray-50">
                <div className="max-w-3xl mx-auto text-center">
                  <h2 
                    className="text-lg font-serif font-bold text-black mb-3"
                    style={{fontFamily: 'Times New Roman, serif'}}
                  >
                    Become a Founding Artist
                  </h2>
                  <p className="text-sm font-sans text-black mb-4 leading-relaxed" style={{fontFamily: 'Arial, sans-serif'}}>
                    We're curating the first 100 artists who will shape Kaleidorium's discovery model.
                  </p>
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 text-left">
                    <h3 className="text-base font-sans font-bold text-black mb-3" style={{fontFamily: 'Arial, sans-serif'}}>
                      Founding Artist Benefits
                    </h3>
                    <div className="space-y-1">
                      <p className="text-xs font-sans text-black" style={{fontFamily: 'Arial, sans-serif'}}>
                        ✓ 12 months of free platform access
                      </p>
                      <p className="text-xs font-sans text-black" style={{fontFamily: 'Arial, sans-serif'}}>
                        ✓ Priority in our AI matching algorithm
                      </p>
                      <p className="text-xs font-sans text-black" style={{fontFamily: 'Arial, sans-serif'}}>
                        ✓ Input on platform development
                      </p>
                      <p className="text-xs font-sans text-black" style={{fontFamily: 'Arial, sans-serif'}}>
                        ✓ Exclusive founding artist badge
                      </p>
                      <p className="text-xs font-sans text-black" style={{fontFamily: 'Arial, sans-serif'}}>
                        ✓ Early access to new features
                      </p>
                      <p className="text-xs font-sans text-black" style={{fontFamily: 'Arial, sans-serif'}}>
                        ✓ Community of like-minded artists
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Portfolio Submission Form */}
              <div id="mobile-portfolio-form" className="py-8 px-4 bg-white">
                <div className="max-w-3xl mx-auto">
                  <div className="text-center mb-6">
                    <h2 
                      className="text-lg font-serif font-bold text-black mb-2"
                      style={{fontFamily: 'Times New Roman, serif'}}
                    >
                      Become a Founding Artist: Submit Your Portfolio
                    </h2>
                    <p className="text-sm font-sans text-black" style={{fontFamily: 'Arial, sans-serif'}}>
                      Join our curated artist community and help shape the future of art discovery.
                    </p>
                  </div>
                  
                  <Card className="mb-8">
                    <CardHeader>
                      <CardTitle 
                        style={{
                          fontSize: '16px',
                          fontFamily: 'Times New Roman, serif',
                          fontWeight: 'bold',
                          color: 'black',
                          lineHeight: '1.2'
                        }}
                      >
                        Become a Founding Artist: Submit Your Portfolio
                      </CardTitle>
                      <CardDescription 
                        style={{
                          fontSize: '14px',
                          fontFamily: 'Arial, sans-serif',
                          color: 'black',
                          lineHeight: '1.4'
                        }}
                      >
                        Please fill out the form below to submit your portfolio for review.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Name</Label>
                          <Input
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            placeholder="Your full name"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            placeholder="your@email.com"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="portfolioLink">Portfolio Link</Label>
                          <Input
                            id="portfolioLink"
                            name="portfolioLink"
                            type="text"
                            value={formData.portfolioLink}
                            onChange={handleChange}
                            required
                            placeholder="www.your-portfolio.com"
                            pattern="^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w-./?%&=]*)?$"
                            title="Please enter a valid website URL (e.g., www.example.com or https://example.com)"
                          />
                        </div>

                        <Button type="submit" className="w-full">
                          Submit Portfolio
                        </Button>
                      </form>

                      <div className="mt-6">
                        <p className="mb-2 text-sm font-sans text-gray-600" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>
                          We will only use the information to review your portfolio and to notify you. If you are not invited, we will delete this information within 1 week.
                        </p>
                        <p className="text-sm font-sans text-gray-600" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>
                          If you are invited and you decide to accept the invitation, we will ask you for more information and record these. If you do not accept the invitation, all the information we hold about you will be deleted.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Invitation Section */}
              <div className="py-8 px-4 bg-gray-50">
                <div className="max-w-3xl mx-auto text-center">
                  <h2 
                    className="text-lg font-serif font-bold text-black mb-4"
                    style={{fontFamily: 'Times New Roman, serif'}}
                  >
                    Have you received your invitation?
                  </h2>
                  <p className="text-sm font-sans text-black mb-6 leading-relaxed" style={{fontFamily: 'Arial, sans-serif'}}>
                    If you've received an invitation email with a token, click below to register.
                  </p>
                  <Button
                    onClick={() => router.push('/for-artists/register')}
                    className="bg-black text-white hover:bg-gray-800 px-8 py-2 text-sm font-medium mb-4"
                    style={{fontFamily: 'Arial, sans-serif'}}
                  >
                    Register as an Artist
                  </Button>
                  <p className="text-xs font-sans text-gray-600" style={{fontFamily: 'Arial, sans-serif'}}>
                    Note: You'll need both your email address and the invitation token we sent you to complete registration.
                  </p>
                </div>
              </div>
            </div>
        ) : (
          // Desktop For Artists Page
          <div className="container mx-auto px-4 py-8 max-w-3xl for-artists-page" data-view="for-artists">
            <div className="mb-8">
                  <h1 
                    className="text-base font-serif font-bold text-black mb-8"
                    style={{fontSize: '16px', fontFamily: 'Times New Roman, serif'}}
                  >
                    Be Discovered. Not Buried.
                  </h1>
                  <p className="text-sm font-sans text-black mb-4" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>
                    You put time, soul, and skill into your work. Only for it to disappear in endless scrolls and overcrowded marketplaces. Kaleidorium changes that.
                  </p>
                  <p className="text-sm font-sans text-black mb-4" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>
                    We're not a gallery, marketplace, or agent.
                  </p>
                  <p className="text-sm font-sans text-black mb-4" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>
                    We're a new kind of discovery platform, powered by AI and built to match your artwork with the right eyes.
                  </p>
                  
                  <p className="text-sm font-sans font-bold text-black mb-4" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>How it works:</p>
                  <ul className="list-disc pl-6 mb-4">
                    <li className="text-sm font-sans text-black" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>Upload your artwork and description</li>
                    <li className="text-sm font-sans text-black" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>Our algorithm shows it to collectors whose tastes match your style</li>
                    <li className="text-sm font-sans text-black" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>When they like it, they're redirected to your own site or portfolio to follow up directly</li>
                    <li className="text-sm font-sans text-black" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>You keep control. No commissions. No middlemen. No gatekeeping.</li>
                  </ul>
                  
                  <p className="text-sm font-sans text-black mb-4" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>
                    Early access artists get 12 months of free uploads.
                  </p>
                  <p className="text-sm font-sans text-black mb-4" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>
                    Submit your portfolio and join our curated artist community
              </p>
            </div>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-base font-serif font-bold text-black" style={{fontSize: '16px', fontFamily: 'Times New Roman, serif'}}>Submit Your Portfolio</CardTitle>
                <CardDescription className="text-sm font-sans text-black" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>
                  Please fill out the form below to submit your portfolio for review.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="Your full name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="your@email.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="portfolioLink">Portfolio Link</Label>
                    <Input
                      id="portfolioLink"
                      name="portfolioLink"
                      type="text"
                      value={formData.portfolioLink}
                      onChange={handleChange}
                      required
                      placeholder="www.your-portfolio.com"
                      pattern="^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w-./?%&=]*)?$"
                      title="Please enter a valid website URL (e.g., www.example.com or https://example.com)"
                    />
                  </div>

                  <Button type="submit" className="w-full">
                    Submit Portfolio
                  </Button>
                </form>

                <div className="mt-6">
                  <p className="mb-2 text-sm font-sans text-gray-600" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>
                    We will only use the information to review your portfolio and to notify you. If you are not invited, we will delete this information within 1 week.
                  </p>
                  <p className="text-sm font-sans text-gray-600" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>
                    If you are invited and you decide to accept the invitation, we will ask you for more information and record these. If you do not accept the invitation, all the information we hold about you will be deleted.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Invitation Section */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-base font-serif font-bold text-black" style={{fontSize: '16px', fontFamily: 'Times New Roman, serif'}}>Have you received your invitation?</CardTitle>
                <CardDescription className="text-sm font-sans text-black" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>
                  If you've received an invitation email with a token, click below to register.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-sm font-sans text-black mb-4" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>
                    Already have your invitation token? Complete your artist registration now.
                  </p>
                  <Button 
                    onClick={() => router.push('/for-artists/register')}
                    className="w-full bg-black text-white hover:bg-gray-800"
                    style={{
                      color: 'white !important', 
                      backgroundColor: 'black !important',
                      borderColor: 'black !important'
                    }}
                  >
                    <span style={{color: 'white !important', fontWeight: 'normal'}}>Register as an Artist</span>
                  </Button>
                </div>
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                  <p className="text-blue-700 font-sans" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>
                    <strong>Note:</strong> You'll need both your email address and the invitation token we sent you to complete registration.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* FAQ Section */}
            <Card id="faq-section" className="mb-8">
              <CardHeader>
                    <CardTitle 
                      style={{
                        fontSize: '16px',
                        fontFamily: 'Times New Roman, serif',
                        fontWeight: 'bold',
                        color: 'black',
                        lineHeight: '1.2'
                      }}
                    >
                      Frequently Asked Questions
                    </CardTitle>
                <p className="text-sm font-sans text-gray-600 leading-relaxed mt-2" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>
                  We're building Kaleidorium for people who care about art, not algorithms. Reach out anytime.
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  
                  <div>
                    <h3
                      className="mb-2 for-artists-faq-question"
                      style={{
                        fontSize: '14px',
                        fontFamily: 'Arial, sans-serif',
                        fontWeight: 'bold',
                        color: 'black',
                        lineHeight: '1.4'
                      }}
                    >
                      Are you a marketplace or a gallery?
                    </h3>
                    <p 
                      className="leading-relaxed for-artists-faq-answer"
                      style={{
                        fontSize: '14px',
                        fontFamily: 'Arial, sans-serif',
                        color: 'black',
                        lineHeight: '1.5'
                      }}
                    >
                      No. Kaleidorium is not a marketplace nor a gallery. We do not facilitate any transaction. We connect artists and collectors. We're not part of any conversation or transaction that follows.
                    </p>
                  </div>

                  <div>
                    <h3 className="mb-2 for-artists-faq-question" style={{fontSize: '16px', fontFamily: '"Times New Roman", serif', fontWeight: 'bold', color: 'black', lineHeight: '1.2'}}>Is there a fee to join or submit my work?</h3>
                    <p className="leading-relaxed for-artists-faq-answer" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif', color: 'black', lineHeight: '1.5'}}>
                      No. Kaleidorium is currently in beta and completely free for artists. There are no commissions, no submission fees, and no hidden charges. In 2026, once we've reached a healthy community size, we may introduce a modest subscription and commission model for artists, with plenty of notice and the option to opt out. Collectors will always enjoy free access. If you ever wish to remove your work, you can do so in one click.
                    </p>
                  </div>

                  <div>
                    <h3 className="mb-2" style={{fontSize: '16px', fontFamily: '"Times New Roman", serif', fontWeight: 'bold', color: 'black', lineHeight: '1.2'}}>How will my artwork be shown to collectors?</h3>
                    <p className="leading-relaxed for-artists-faq-answer" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif', color: 'black', lineHeight: '1.5'}}>
                      Your work is not displayed side-by-side in a crowded feed. Instead, it's shown individually to collectors whose preferences suggest they'll genuinely appreciate it. We use a personalized matching approach, more like a curator than a catalogue.
                    </p>
                  </div>

                  <div>
                    <h3 className="mb-2" style={{fontSize: '16px', fontFamily: '"Times New Roman", serif', fontWeight: 'bold', color: 'black', lineHeight: '1.2'}}>What happens when collectors are interested?</h3>
                    <p className="leading-relaxed for-artists-faq-answer" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif', color: 'black', lineHeight: '1.5'}}>
                      Each artwork links directly to your own website, online store, or gallery page. Kaleidorium does not handle transactions. We simply bring qualified, interested collectors to you. If you're represented by a gallery, you can set your redirect link to point there instead.
                    </p>
                  </div>

                  <div>
                    <h3 className="mb-2" style={{fontSize: '16px', fontFamily: '"Times New Roman", serif', fontWeight: 'bold', color: 'black', lineHeight: '1.2'}}>Why did you create Kaleidorium?</h3>
                    <p className="leading-relaxed for-artists-faq-answer" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif', color: 'black', lineHeight: '1.5'}}>
                      We've seen too many brilliant artists struggle to get noticed. In a world overflowing with content, being good is no longer enough, you also need to be found. Kaleidorium helps solve this by curating artwork to match each collector's taste, increasing the chance of discovery and appreciation.
                    </p>
                  </div>

                  <div>
                    <h3 className="mb-2" style={{fontSize: '16px', fontFamily: '"Times New Roman", serif', fontWeight: 'bold', color: 'black', lineHeight: '1.2'}}>Is this just another algorithm that narrows people's view?</h3>
                    <p className="leading-relaxed for-artists-faq-answer" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif', color: 'black', lineHeight: '1.5'}}>
                      Not at all. While we use AI to recommend art, we deliberately include moments of serendipity and surprise. Think of it like a trusted friend who knows your taste, but also knows how to stretch it thoughtfully.
                    </p>
                  </div>

                  <div>
                    <h3 className="mb-2" style={{fontSize: '16px', fontFamily: '"Times New Roman", serif', fontWeight: 'bold', color: 'black', lineHeight: '1.2'}}>Who owns the rights to my artwork and data?</h3>
                    <p className="leading-relaxed for-artists-faq-answer" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif', color: 'black', lineHeight: '1.5'}}>
                      You do. Always. We make no claim on your images, metadata, or portfolio. You retain full control and copyright.
                    </p>
                  </div>

                  <div>
                    <h3 className="mb-2" style={{fontSize: '16px', fontFamily: '"Times New Roman", serif', fontWeight: 'bold', color: 'black', lineHeight: '1.2'}}>Is the service also free for collectors?</h3>
                    <p className="leading-relaxed for-artists-faq-answer" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif', color: 'black', lineHeight: '1.5'}}>
                      Yes. Kaleidorium is free for collectors to browse, swipe, and discover work they love. This encourages more engagement and visibility for your art.
                    </p>
                  </div>

                  <div>
                    <h3 className="mb-2" style={{fontSize: '16px', fontFamily: '"Times New Roman", serif', fontWeight: 'bold', color: 'black', lineHeight: '1.2'}}>How does the recommendation engine work?</h3>
                    <p className="leading-relaxed for-artists-faq-answer" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif', color: 'black', lineHeight: '1.5'}}>
                      We combine a trained AI assistant with a custom-built taxonomy and feedback loops. The more users interact, the smarter the matching becomes, helping the right collectors find the right artists.
                    </p>
                  </div>

                  <div>
                    <h3 className="mb-2" style={{fontSize: '16px', fontFamily: '"Times New Roman", serif', fontWeight: 'bold', color: 'black', lineHeight: '1.2'}}>Do you accept all submissions?</h3>
                    <p className="leading-relaxed for-artists-faq-answer" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif', color: 'black', lineHeight: '1.5'}}>
                      We review each portfolio manually. We're not looking for a specific style. We welcome diversity, from abstract to figurative, classic to digital. But we do assess for originality, craft, and commercial potential (even if niche). Our goal is to maintain a high-quality, artistically-intentional experience.
                    </p>
                  </div>

                  <div>
                    <h3 className="mb-2" style={{fontSize: '16px', fontFamily: '"Times New Roman", serif', fontWeight: 'bold', color: 'black', lineHeight: '1.2'}}>Who reviews the portfolios, and what happens after I submit?</h3>
                    <p className="leading-relaxed for-artists-faq-answer" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif', color: 'black', lineHeight: '1.5'}}>
                      All submissions are reviewed by a small collective of people involved in the arts - including curators, artists, and collectors - who help us maintain artistic integrity and variety. If your portfolio isn't selected right away, don't worry, you can always refine and resubmit at a later stage. If your work is selected, you'll receive an official invitation with a unique token to create your account. Registration is fast, intuitive, and once complete, you can start uploading your artwork immediately.
                    </p>
                  </div>

                </div>
              </CardContent>
            </Card>
          </div>
        )
      ) : (
        // Profile view
        isMobile || isTablet ? (
          // Mobile Profile Page with Header
          <div className="fixed inset-0 bg-white z-50 flex flex-col">
            <NewMobileHeader currentPage="profile" collectionCount={collectionCount} setView={(view) => {
              if (["discover", "collection", "profile", "for-artists"].includes(view)) {
                setView(view as "discover" | "collection" | "profile" | "for-artists");
              }
            }} />
            
            {/* Profile Content */}
            <div className="flex-1 overflow-y-auto pt-16">
        <ProfilePage collection={dbCollection} onReturnToDiscover={() => setView("discover")} />
            </div>
          </div>
        ) : (
          // Desktop Profile Page
          <ProfilePage collection={dbCollection} onReturnToDiscover={() => setView("discover")} />
        )
      )}


      {/* User Engagement Overlays */}
      <WelcomeBackOverlay
        show={showWelcomeBack}
        newArtworkCount={newArtworkCount}
        onDismiss={dismissWelcomeBack}
      />
      
    </div>
  )
}

