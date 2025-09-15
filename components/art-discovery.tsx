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
import { AppHeader, type FilterState } from "@/components/app-header"
import { useKeyboardShortcut } from "@/hooks/use-keyboard-shortcut"
import { ImageOverlay } from "@/components/image-overlay"
import { ProfilePage } from "@/components/profile-page"
import { supabase } from "@/lib/supabase"
import type { Artwork } from "@/types/artwork"
import { v4 as uuidv4 } from 'uuid'
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip } from "@/components/ui/tooltip"
import { AboutContent } from "@/components/about-content"
import { useViewContext } from "./ViewContext"
import { useMobileDetection } from "@/hooks/use-mobile-detection"
import MobileArtDiscovery from "./mobile-art-discovery"
import ProgressiveImage from "./progressive-image"
import CardStack from "./card-stack"

interface AppHeaderProps {
  view: "discover" | "collection" | "profile" | "for-artists" | "about" | "contact"
  setView: (view: "discover" | "collection" | "profile" | "for-artists" | "about" | "contact") => void
  collectionCount: number
}

interface ArtDiscoveryProps {
  view: "discover" | "collection" | "profile" | "for-artists" | "about" | "contact";
  setView: (view: "discover" | "collection" | "profile" | "for-artists" | "about" | "contact") => void;
  collectionCount: number;
  setCollectionCount: (count: number) => void;
}

export default function ArtDiscovery({ view, setView, collectionCount, setCollectionCount }: ArtDiscoveryProps) {
  const { isMobile, isTablet, isLandscape, isPortrait, screenWidth, screenHeight } = useMobileDetection()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [artworks, setArtworks] = useState<Artwork[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [collection, setCollection] = useState<Artwork[]>([])
  const [user, setUser] = useState<{ id: string } | null>(null)
  const { toast } = useToast()
  const router = useRouter()

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
  const [activeFilters, setActiveFilters] = useState<{
    style: string;
    subject: string;
    colors: string;
  }>({
    style: '',
    subject: '',
    colors: ''
  })
  const [isFiltering, setIsFiltering] = useState(false)
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
        .single()

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
        console.error('Error updating collector preferences:', upsertError)
        return null
      }
      console.log('updatePreferences: success', updateData);
      return updateData
    } catch (error) {
      console.error('Error updating preferences:', error)
      return null
    }
  }

  // Function to get artwork recommendations
  const getRecommendations = async (userId: string, artworks: Artwork[]) => {
    try {
      console.log('getRecommendations: called', { userId, artworksLength: artworks.length });
      
      // Get collector preferences and collection
      const { data: collector, error: fetchError } = await supabase
        .from('Collectors')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (fetchError) {
        console.error('Error fetching collector preferences:', fetchError)
        return artworks
      }

      const preferences = collector.preferences || {}
      const viewedArtworks = preferences.viewed_artworks || []
      
      // Filter out viewed artworks
      const unviewedArtworks = artworks.filter(artwork => !viewedArtworks.includes(artwork.id))
      
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

      // Get user's collection for additional matching
      const { data: collectionData } = await supabase
        .from('Collection')
        .select('artwork_id')
        .eq('user_id', userId)

      const collectionArtworkIds = collectionData?.map(item => item.artwork_id) || []
      const collectionArtworks = artworks.filter(artwork => collectionArtworkIds.includes(artwork.id))
      
      // Create a map of preferred attributes from collection items
      interface PreferenceMap {
        [key: string]: number
      }

      interface CollectionPreferences {
        artists: PreferenceMap
        genres: PreferenceMap
        styles: PreferenceMap
        subjects: PreferenceMap
        colors: PreferenceMap
        priceRanges: PreferenceMap
        [key: string]: PreferenceMap // Allow string indexing
      }

      const collectionPreferences: CollectionPreferences = {
        artists: {},
        genres: {},
        styles: {},
        subjects: {},
        colors: {},
        priceRanges: {}
      }

      // Build collection preferences
      collectionArtworks.forEach(artwork => {
        const addPreference = (category: string, value: string | undefined) => {
          if (!value) return
          const categoryMap = collectionPreferences[category] || {}
          categoryMap[value] = (categoryMap[value] || 0) + WEIGHTS.COLLECTION_MATCH
          collectionPreferences[category] = categoryMap
        }

        addPreference('artists', artwork.artist)
        addPreference('genres', artwork.genre)
        addPreference('styles', artwork.style)
        addPreference('subjects', artwork.subject)
        addPreference('colors', artwork.colour)

        const priceValue = parseFloat(artwork.price.replace(/[^0-9.-]+/g, ""))
        if (!isNaN(priceValue)) {
          const priceRange = Math.floor(priceValue / 1000) * 1000
          addPreference('priceRanges', priceRange.toString())
        }
      })
      
      // Calculate scores based on collector preferences AND collection matches
      const scoredArtworks = unviewedArtworks.map(artwork => {
        let score = 0

        // Helper function to calculate score for a category
        const calculateCategoryScore = (
          category: 'artists' | 'genres' | 'styles' | 'subjects' | 'colors' | 'priceRanges',
          value: string | undefined
        ): number => {
          if (!value) return 0
          let score = 0
          // Add score from general preferences
          if (preferences[category]?.[value]) {
            score += preferences[category][value]
          }
          // Add score from collection matches
          if (collectionPreferences[category]?.[value]) {
            score += collectionPreferences[category][value]
          }
          return score
        }

        // Calculate scores for each category with updated weights
        score += calculateCategoryScore('artists', artwork.artist) * 2.5 // Artist match is most important
        score += calculateCategoryScore('genres', artwork.genre) * 2.0
        score += calculateCategoryScore('styles', artwork.style) * 2.0
        score += calculateCategoryScore('subjects', artwork.subject) * 1.5
        score += calculateCategoryScore('colors', artwork.colour) * 1.0

        // Price range score
        const priceValue = parseFloat(artwork.price.replace(/[^0-9.-]+/g, ""))
        if (!isNaN(priceValue)) {
          const priceRange = Math.floor(priceValue / 1000) * 1000
          score += calculateCategoryScore('priceRanges', priceRange.toString()) * 0.8
        }

        return { ...artwork, score }
      })

      // Sort by score (highest first) and ensure some randomization for similar scores
      const sorted = scoredArtworks
        .sort((a, b) => {
          const scoreDiff = b.score - a.score
          // If scores are very close, add some randomness
          return Math.abs(scoreDiff) < 0.2 ? Math.random() - 0.5 : scoreDiff
        });
      console.log('getRecommendations: sorted', sorted);
      return sorted;
    } catch (error) {
      console.error('Error getting recommendations:', error)
      return artworks
    }
  }

  // Update user authentication effect
  useEffect(() => {
    const initAuth = async () => {
      // Get initial session
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUser(session.user)
        await ensureCollectorProfile(session.user)
      }

      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          setUser(session.user)
          await ensureCollectorProfile(session.user)
    } else {
          setUser(null)
        }
      })

      return () => {
        subscription.unsubscribe()
      }
    }

    initAuth()
  }, [])

  // Helper function to ensure collector profile exists
  const ensureCollectorProfile = async (user: any) => {
    const { data: collector } = await supabase
      .from('Collectors')
      .select('id')
      .eq('user_id', user.id)
      .single()

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
        .single()

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

  // Helper to update local preferences
  const updateLocalPreferences = (artwork: Artwork, action: 'add' | 'like' | 'dislike') => {
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
    updateCount('genres', artwork.genre);
    updateCount('styles', artwork.style);
    updateCount('subjects', artwork.subject);
    updateCount('colors', artwork.colour);
    const priceValue = parseFloat(artwork.price.replace(/[^0-9.-]+/g, ""));
    if (!isNaN(priceValue)) {
      const priceRange = Math.floor(priceValue / 1000) * 1000;
      updateCount('priceRanges', priceRange.toString());
    }
    updated.interactionCount = (updated.interactionCount || 0) + 1;
    setLocalPreferences(updated);
    return updated;
  };

  // Helper to get recommendations for anonymous users
  const getLocalRecommendations = (artworks: Artwork[]) => {
    const preferences = localPreferences;
    const viewedArtworks = preferences.viewed_artworks || [];
    const unviewedArtworks = artworks.filter(artwork => !viewedArtworks.includes(artwork.id));
    if (unviewedArtworks.length === 0) {
      preferences.viewed_artworks = [];
      setLocalPreferences({ ...preferences });
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
        if (preferences[category]?.[value]) {
          score += preferences[category][value];
        }
        return score;
      };
      score += calculateCategoryScore('artists', artwork.artist) * 2.5;
      score += calculateCategoryScore('genres', artwork.genre) * 2.0;
      score += calculateCategoryScore('styles', artwork.style) * 2.0;
      score += calculateCategoryScore('subjects', artwork.subject) * 1.5;
      score += calculateCategoryScore('colors', artwork.colour) * 1.0;
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
  const handleDislike = useCallback(async () => {
    if (!mounted || !currentArtwork) return;
    
    // Track analytics
    await trackAnalytics(currentArtwork.id, 'dislike', user?.id);
    
    if (!user) {
      updateLocalPreferences(currentArtwork, 'dislike');
      const recommendedArtworks = getLocalRecommendations(artworks);
      setArtworks(recommendedArtworks);
      const newIndex = currentIndex === artworks.length - 1 ? 0 : currentIndex + 1;
      setCurrentIndex(newIndex);
    toast({
      title: "Artwork disliked",
        description: `You disliked \"${currentArtwork.title}\" by ${currentArtwork.artist}`,
      variant: "destructive",
      });
      // Check for end of matches
      if (checkEndOfMatches(recommendedArtworks, [...localPreferences.viewed_artworks, currentArtwork.id])) {
        setShowEndOfMatchesOverlay(true);
      }
      return;
    }
    if (!await handleAuthAction('dislike', currentArtwork)) return;
    const newPreferences = await updatePreferences(user.id, currentArtwork, 'dislike');
    if (newPreferences) {
      const recommendedArtworks = await getRecommendations(user.id, artworks);
      setArtworks(recommendedArtworks);
      // Check for end of matches
      if (checkEndOfMatches(recommendedArtworks, newPreferences.preferences.viewed_artworks)) {
        setShowEndOfMatchesOverlay(true);
      }
    }
    const newIndex = currentIndex === artworks.length - 1 ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
    toast({
      title: "Artwork disliked",
      description: `You disliked \"${currentArtwork.title}\" by ${currentArtwork.artist}`,
      variant: "destructive",
    });
  }, [mounted, currentArtwork, currentIndex, artworks.length, toast, user, artworks, localPreferences]);

  // Refactored handleLike
  const handleLike = useCallback(async () => {
    if (!mounted || !currentArtwork) return;
    
    // Track analytics
    await trackAnalytics(currentArtwork.id, 'like', user?.id);
    
    if (!user) {
      updateLocalPreferences(currentArtwork, 'like');
      const recommendedArtworks = getLocalRecommendations(artworks);
      setArtworks(recommendedArtworks);
      const newIndex = currentIndex === artworks.length - 1 ? 0 : currentIndex + 1;
      setCurrentIndex(newIndex);
    toast({
      title: "Artwork liked",
        description: `You liked \"${currentArtwork.title}\" by ${currentArtwork.artist}`,
      });
      // Check for end of matches
      if (checkEndOfMatches(recommendedArtworks, [...localPreferences.viewed_artworks, currentArtwork.id])) {
        setShowEndOfMatchesOverlay(true);
      }
      return;
    }
    if (!await handleAuthAction('like', currentArtwork)) return;
    const newPreferences = await updatePreferences(user.id, currentArtwork, 'like');
    if (newPreferences) {
      const recommendedArtworks = await getRecommendations(user.id, artworks);
      setArtworks(recommendedArtworks);
      // Check for end of matches
      if (checkEndOfMatches(recommendedArtworks, newPreferences.preferences.viewed_artworks)) {
        setShowEndOfMatchesOverlay(true);
      }
    }
    const newIndex = currentIndex === artworks.length - 1 ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
    toast({
      title: "Artwork liked",
      description: `You liked \"${currentArtwork.title}\" by ${currentArtwork.artist}`,
    });
  }, [mounted, currentArtwork, currentIndex, artworks.length, toast, user, artworks, localPreferences]);

  // Enhanced handleAddToCollection with localStorage persistence
  const handleAddToCollection = useCallback(async () => {
    if (!mounted || !currentArtwork) return;
    
    // Track analytics
    await trackAnalytics(currentArtwork.id, 'add_to_collection', user?.id);
    
    if (!user) {
      updateLocalPreferences(currentArtwork, 'add');
      if (currentArtwork && currentArtwork.id && !collection.some((item) => item.id === currentArtwork.id)) {
        const newCollection = [...collection, currentArtwork];
        setCollection(newCollection);
        saveTemporaryCollection(newCollection); // Persist to localStorage
        toast({
          title: "Added to collection",
          description: `\"${currentArtwork.title}\" has been added to your collection.`,
        });
      } else if (currentArtwork && currentArtwork.id) {
        toast({
          title: "Already in collection",
          description: "This artwork is already in your collection.",
        });
      }
      const recommendedArtworks = getLocalRecommendations(artworks);
      setArtworks(recommendedArtworks);
      const newIndex = currentIndex === artworks.length - 1 ? 0 : currentIndex + 1;
      setCurrentIndex(newIndex);
      // Check for end of matches
      if (checkEndOfMatches(recommendedArtworks, [...localPreferences.viewed_artworks, currentArtwork.id])) {
        setShowEndOfMatchesOverlay(true);
      }
      return;
    }
    if (!await handleAuthAction('add', currentArtwork)) return;
    const newPreferences = await updatePreferences(user.id, currentArtwork, 'add');
    if (newPreferences) {
      const recommendedArtworks = await getRecommendations(user.id, artworks);
      setArtworks(recommendedArtworks);
      // Check for end of matches
      if (checkEndOfMatches(recommendedArtworks, newPreferences.preferences.viewed_artworks)) {
        setShowEndOfMatchesOverlay(true);
      }
    }
    if (user && currentArtwork && currentArtwork.id) {
      // Check if already in collection using maybeSingle to avoid errors on no results
      const { data: existing, error: checkError } = await supabase
        .from('Collection')
        .select('id')
        .eq('user_id', user.id)
        .eq('artwork_id', Number(currentArtwork.id))
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
          .insert({ user_id: user.id, artwork_id: Number(currentArtwork.id) });

        if (insertError) {
          console.error('Insert error:', insertError);
          toast({
            title: "Error saving to collection",
            description: insertError.message,
            variant: "destructive",
          });
    } else {
          // On success, show toast and refetch the collection to update the UI.
          toast({
            title: "Added to collection",
            description: `\"${currentArtwork.title}\" has been added to your collection.`,
          });
          fetchUserCollection(); // Refetch the collection.
        }
      } else {
        // If it already exists, just show a toast.
      toast({
        title: "Already in collection",
        description: "This artwork is already in your collection.",
        });
      }
    }
    const newIndex = currentIndex === artworks.length - 1 ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  }, [mounted, currentArtwork, currentIndex, artworks.length, collection, toast, user, artworks, localPreferences]);

  // Update fetchArtworks to use recommendations if user exists
  const fetchArtworks = useCallback(async () => {
    try {
      setLoading(true);
      
      // First test the connection
      const { count, error: countError } = await supabase
        .from('Artwork')
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.error('Error testing Supabase connection:', countError);
        throw countError;
      }
      

      // Fetch artworks with exact column names from Supabase
      const { data: artworksData, error } = await supabase
        .from('Artwork')
        .select(`
          id,
          artwork_title,
          artist,
          description,
          price,
          genre,
          style,
          subject,
          artwork_image,
          medium,
          colour
        `);

      console.log('Raw Supabase response:', { artworksData, error });

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

      const transformedArtworks = artworksData.map(artwork => {
        // Format price with currency if available
        let formattedPrice = artwork.price || 'Price on request';
        if (artwork.price && 'currency' in artwork && artwork.currency) {
          formattedPrice = `${artwork.currency} ${artwork.price}`;
        }
        // Only include one colour tag: use colour column
        const tags = [
          artwork.genre,
          artwork.style,
          artwork.subject,
          artwork.colour
        ].filter(Boolean);
        return {
          id: artwork.id?.toString() || Math.random().toString(),
          title: artwork.artwork_title || 'Untitled',
          artist: artwork.artist || 'Unknown Artist',
          medium: artwork.medium || 'Digital Art',
          dimensions: (artwork as any).dimensions || '1920x1080',
          year: (artwork as any).year || "2025",
          price: formattedPrice,
          description: artwork.description || 'No description available',
          tags,
          artwork_image: artwork.artwork_image || "/placeholder.svg",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          style: artwork.style,
          genre: artwork.genre,
          subject: artwork.subject,
          colour: artwork.colour
        };
      });

      
      setArtworks(transformedArtworks);

      if (user) {
        console.log('Fetching collector preferences for user:', user.id);
        const { data: collector, error: collectorError } = await supabase
          .from('Collectors')
          .select('preferences')
          .eq('user_id', user.id)
          .single();

        if (collectorError) {
          console.error('Error fetching collector preferences:', collectorError);
        } else if (collector?.preferences) {
          console.log('Found collector preferences, getting recommendations...');
          const recommendedArtworks = await getRecommendations(user.id, transformedArtworks);
          setArtworks(recommendedArtworks);
        }
      }
    } catch (error) {
      console.error('Detailed error in fetchArtworks:', error);
      toast({
        title: "Error loading artworks",
        description: "Failed to load artworks. Please try again.",
        variant: "destructive",
      });
      setArtworks([]);
    } finally {
      setLoading(false);
    }
  }, [user, toast])

  // Handle client-side initialization and data fetching
  useEffect(() => {
    setMounted(true)
    fetchArtworks()
  }, [fetchArtworks])

  // Load more artworks for infinite scroll/prefetching
  const loadMoreArtworks = useCallback(async () => {
    if (loading) return
    
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
  }, [loading, artworks])

  // Handle moving to the next artwork
  const handleNext = () => {
    const currentArtworkList = isFiltering ? filteredArtworks : artworks
    if (currentIndex < currentArtworkList.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  // Handle filter changes with intelligent fallback
  const handleFilterChange = (filters: FilterState) => {
    console.log('Applying filters:', filters)
    setActiveFilters(filters)
    setIsFiltering(true)
    setCurrentIndex(0) // Reset to first artwork
    
    // Strategy 1: Try exact matching (all filters must match)
    let filtered = artworks.filter(artwork => {
      let matches = true
      
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
      if (filters.subject.trim()) {
        const subjectKeywords = filters.subject.toLowerCase().split(',').map(s => s.trim())
        const artworkSubject = (artwork.subject || '').toLowerCase()
        const artworkTitle = artwork.title.toLowerCase()
        const artworkTags = (artwork.tags || []).map(tag => tag.toLowerCase())
        
        const subjectMatch = subjectKeywords.some(keyword => 
          artworkSubject.includes(keyword) || 
          artworkTitle.includes(keyword) ||
          artworkTags.some(tag => tag.includes(keyword))
        )
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
    if (filtered.length === 0) {
      console.log('No exact matches found, trying partial matching...')
      filtered = artworks.filter(artwork => {
        let hasAnyMatch = false
        
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
        if (filters.subject.trim()) {
          const subjectKeywords = filters.subject.toLowerCase().split(',').map(s => s.trim())
          const artworkSubject = (artwork.subject || '').toLowerCase()
          const artworkTitle = artwork.title.toLowerCase()
          const artworkTags = (artwork.tags || []).map(tag => tag.toLowerCase())
          
          const subjectMatch = subjectKeywords.some(keyword => 
            artworkSubject.includes(keyword) || 
            artworkTitle.includes(keyword) ||
            artworkTags.some(tag => tag.includes(keyword))
          )
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
    
    // Strategy 3: If still no matches, show all artworks with a message
    if (filtered.length === 0) {
      console.log('No partial matches found, showing all artworks with fallback message')
      filtered = artworks
      setShowFallbackMessage(true)
    } else {
      setShowFallbackMessage(false)
    }
    
    console.log(`Filtered ${filtered.length} artworks from ${artworks.length} total`)
    setFilteredArtworks(filtered)
  }

  // Clear filters function
  const clearFilters = () => {
    setIsFiltering(false)
    setActiveFilters({ style: '', subject: '', colors: '' })
    setFilteredArtworks([])
    setCurrentIndex(0)
    setShowFallbackMessage(false)
    
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
      colors: filters.colors.join(', ')
    }
    handleFilterChange(filterState)
  }

  // Setup keyboard shortcuts only on the client side
  useEffect(() => {
    if (!mounted) return

    const handleKeyDown = (e: KeyboardEvent) => {
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
  }, [mounted, handleDislike, handleLike, handleAddToCollection])

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
    // Use the same logic as desktop handleLike
    await handleLike();
  };

  const handleMobileDislike = async (artwork: Artwork) => {
    // Use the same logic as desktop handleDislike
    await handleDislike();
  };

  const handleMobileAddToCollection = async (artwork: Artwork) => {
    // Use the same logic as desktop handleAddToCollection
    await handleAddToCollection();
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
        title: "Thank you for your submission",
        description: "Our curators will review your work and we will come back to you in a few days. We may ask you some questions by email as a follow-up. To manage expectations, we accept less than 5% of submissions.",
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
  const fetchUserCollection = async () => {
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
  };

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

  if (!mounted || loading) {
  return (
      <div className="flex flex-col min-h-screen">
        <div className="flex-1 flex items-center justify-center">
          {loading ? "Loading artworks..." : "Loading..."}
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
      {/* Desktop Header - only show on desktop */}
      {!isMobile && !isTablet && (
        <AppHeader 
        view={view} 
        setView={setView} 
        collectionCount={collectionCount}
        onFilterChange={handleFilterChange}
        onClearFilters={clearFilters}
        isFiltering={isFiltering}
        availableTags={availableTags}
      />
      )}
      
      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-medium">Create an Account</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowAuthModal(false)}>
                <X className="h-4 w-4" />
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

      {view === "about" ? (
        isMobile || isTablet ? (
          // Mobile About Page with Header
          <div className="fixed inset-0 bg-white z-50 flex flex-col">
            {/* Mobile Header */}
            <div className="flex justify-between items-center p-4 bg-white border-b border-gray-200">
              <h1 className="text-xl font-bold text-black">Kaleidorium</h1>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  console.log('Mobile hamburger menu clicked!');
                  setShowMenuModal(true);
                }}
                className="text-black hover:bg-gray-100"
              >
                <Menu className="w-6 h-6" />
              </Button>
            </div>
            
            {/* About Content */}
            <div className="flex-1 overflow-y-auto">
              <AboutContent setView={setView} />
            </div>
          </div>
        ) : (
          // Desktop About Page
          <AboutContent setView={setView} />
        )
      ) : view === "discover" ? (
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
        ) : currentArtwork ? (
          <CardStack
            artworks={currentArtworkList}
            currentIndex={currentIndex}
            onLike={handleLike}
            onDislike={handleDislike}
            onAddToCollection={handleAddToCollection}
            onNext={handleNext}
            onLoadMore={loadMoreArtworks}
            onImageClick={openImageOverlay}
            loading={loading}
            showFallbackMessage={showFallbackMessage}
          />
        ) : null
      ) : view === "collection" ? (
        isMobile || isTablet ? (
          // Mobile Collection Page with Header
          <div className="fixed inset-0 bg-white z-50 flex flex-col">
            {/* Mobile Header */}
            <div className="flex justify-between items-center p-4 bg-white border-b border-gray-200">
              <h1 className="text-xl font-bold text-black">Kaleidorium</h1>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  console.log('Mobile hamburger menu clicked!');
                  setShowMenuModal(true);
                }}
                className="text-black hover:bg-gray-100"
              >
                <Menu className="w-6 h-6" />
              </Button>
            </div>
            
            {/* Mobile Collection Content */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="mb-6 flex flex-col justify-between items-start gap-4">
                <h2 className="font-serif text-[28px] leading-tight">My Collection ({(user ? dbCollection : collection).length})</h2>
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
              <h2 className="font-serif text-[28px] leading-tight">My Collection ({(user ? dbCollection : collection).length})</h2>
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
                          <h3 className="font-medium font-serif text-base sm:text-lg truncate">{artwork.title}</h3>
                          <p className="text-xs sm:text-sm text-muted-foreground truncate">{artwork.artist}</p>
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
          // Mobile For Artists Page with Header
          <div className="fixed inset-0 bg-white z-50 flex flex-col">
            {/* Mobile Header */}
            <div className="flex justify-between items-center p-4 bg-white border-b border-gray-200">
              <h1 className="text-xl font-bold text-black">Kaleidorium</h1>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  console.log('Mobile hamburger menu clicked!');
                  setShowMenuModal(true);
                }}
                className="text-black hover:bg-gray-100"
              >
                <Menu className="w-6 h-6" />
              </Button>
            </div>
            
            {/* For Artists Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="container mx-auto px-4 py-8 max-w-3xl">
                <div className="mb-8">
                  <h1 className="text-base font-serif font-bold text-black mb-4" style={{fontSize: '16px', fontFamily: 'Times New Roman, serif'}}>Be Discovered. Not Buried.</h1>
                  <p className="text-sm font-sans text-black mb-4" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>
                    You put time, soul, and skill into your work—only for it to disappear in endless scrolls and overcrowded marketplaces. Kaleidorium changes that.
                  </p>
                  <p className="text-sm font-sans text-black mb-4" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>
                    We're not a gallery, marketplace, or agent.
                  </p>
                  <p className="text-sm font-sans text-black mb-4" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>
                    We're a new kind of discovery platform, powered by AI and built to match your artwork with the right eyes.
                  </p>
                  <p className="text-sm font-sans font-bold text-black mb-2" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>How it works:</p>
                  <ul className="text-sm font-sans text-black mb-4 space-y-2" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>
                    <li>• Upload your artwork and description</li>
                    <li>• Our algorithm shows it to collectors whose tastes match your style</li>
                    <li>• When they like it, they're redirected to your own site or portfolio to follow up directly</li>
                    <li>• You keep control. No commissions. No middlemen. No gatekeeping.</li>
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
                      <Button 
                        onClick={() => router.push('/for-artists/register')}
                        className="w-full"
                      >
                        Register as an Artist
                      </Button>
                    </div>
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                      <p className="text-blue-700">
                        <strong>Note:</strong> You'll need both your email address and the invitation token we sent you to complete registration.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        ) : (
          // Desktop For Artists Page
          <div className="container mx-auto px-4 py-8 max-w-3xl">
            <div className="mb-8">
                  <h1 className="text-lg font-semibold mb-4">Be Discovered. Not Buried.</h1>
                  <p className="text-base mb-4">
                    You put time, soul, and skill into your work—only for it to disappear in endless scrolls and overcrowded marketplaces. Kaleidorium changes that.
                  </p>
                  <p className="text-base mb-4">
                    We're not a gallery, marketplace, or agent.
                  </p>
                  <p className="text-base mb-4">
                    We're a new kind of discovery platform, powered by AI and built to match your artwork with the right eyes.
                  </p>
                  <p className="text-base font-semibold mb-2">Here's how it works:</p>
                  <ul className="text-base mb-4 space-y-2">
                    <li>• Upload your artwork and description</li>
                    <li>• Our algorithm shows it to collectors whose tastes match your style</li>
                    <li>• When they like it, they're redirected to your own site or portfolio to follow up directly</li>
                    <li>• You keep control. No commissions. No middlemen. No gatekeeping.</li>
                  </ul>
                  <p className="text-base mb-4">
                    Early access artists get 12 months of free uploads.
                  </p>
                  <p className="text-base mb-4">
                    Submit your portfolio and join our curated artist community
                  </p>
            </div>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Submit Your Portfolio</CardTitle>
                <CardDescription>
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
                <CardTitle className="text-lg font-semibold">Have you received your invitation?</CardTitle>
                <CardDescription>
                  If you've received an invitation email with a token, click below to register.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-gray-600 mb-4">
                    Already have your invitation token? Complete your artist registration now.
                  </p>
                  <Button 
                    onClick={() => router.push('/for-artists/register')}
                    className="w-full"
                  >
                    Register as an Artist
                  </Button>
                </div>
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                  <p className="text-blue-700">
                    <strong>Note:</strong> You'll need both your email address and the invitation token we sent you to complete registration.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* FAQ Section */}
            <Card id="faq-section" className="mb-8">
              <CardHeader>
                <CardTitle className="text-base font-serif font-bold text-black" style={{fontSize: '16px', fontFamily: 'Times New Roman, serif'}}>Frequently Asked Questions</CardTitle>
                <p className="text-sm font-sans text-gray-600 leading-relaxed mt-2" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>
                  We're building Kaleidorium for people who care about art, not algorithms. Reach out anytime.
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  
                  <div>
                    <h3 className="text-sm font-sans font-bold text-black mb-2" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>Are you a marketplace or a gallery?</h3>
                    <p className="text-sm font-sans text-black leading-relaxed" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>
                      No. Kaleidorium is not a marketplace nor a gallery. We do not facilitate any transaction. We connect artists and collectors—we're not part of any conversation or transaction that follows.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-sans font-bold text-black mb-2" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>Is there a fee to join or submit my work?</h3>
                    <p className="text-sm font-sans text-black leading-relaxed" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>
                      No. Kaleidorium is currently in beta and completely free for artists. There are no commissions, no submission fees, and no hidden charges. In 2026, once we've reached a healthy community size, we may introduce a modest subscription and commission model for artists, with plenty of notice and the option to opt out. Collectors will always enjoy free access. If you ever wish to remove your work, you can do so in one click.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-sans font-bold text-black mb-2" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>How will my artwork be shown to collectors?</h3>
                    <p className="text-sm font-sans text-black leading-relaxed" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>
                      Your work is not displayed side-by-side in a crowded feed. Instead, it's shown individually to collectors whose preferences suggest they'll genuinely appreciate it. We use a personalized matching approach, more like a curator than a catalogue.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-sans font-bold text-black mb-2" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>What happens when collectors are interested?</h3>
                    <p className="text-sm font-sans text-black leading-relaxed" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>
                      Each artwork links directly to your own website, online store, or gallery page. Kaleidorium does not handle transactions. We simply bring qualified, interested collectors to you. If you're represented by a gallery, you can set your redirect link to point there instead.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-sans font-bold text-black mb-2" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>Why did you create Kaleidorium?</h3>
                    <p className="text-sm font-sans text-black leading-relaxed" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>
                      We've seen too many brilliant artists struggle to get noticed. In a world overflowing with content, being good is no longer enough, you also need to be found. Kaleidorium helps solve this by curating artwork to match each collector's taste, increasing the chance of discovery and appreciation.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-sans font-bold text-black mb-2" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>Is this just another algorithm that narrows people's view?</h3>
                    <p className="text-sm font-sans text-black leading-relaxed" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>
                      Not at all. While we use AI to recommend art, we deliberately include moments of serendipity and surprise. Think of it like a trusted friend who knows your taste, but also knows how to stretch it thoughtfully.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-sans font-bold text-black mb-2" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>Who owns the rights to my artwork and data?</h3>
                    <p className="text-sm font-sans text-black leading-relaxed" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>
                      You do. Always. We make no claim on your images, metadata, or portfolio. You retain full control and copyright.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Is the service also free for collectors?</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Yes. Kaleidorium is free for collectors to browse, swipe, and discover work they love. This encourages more engagement and visibility for your art.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">How does the recommendation engine work?</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      We combine a trained AI assistant with a custom-built taxonomy and feedback loops. The more users interact, the smarter the matching becomes, helping the right collectors find the right artists.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Do you accept all submissions?</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      We review each portfolio manually. We're not looking for a specific style. We welcome diversity, from abstract to figurative, classic to digital. But we do assess for originality, craft, and commercial potential (even if niche). Our goal is to maintain a high-quality, artistically-intentional experience.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Who reviews the portfolios, and what happens after I submit?</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
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
        <ProfilePage collection={dbCollection} onReturnToDiscover={() => setView("discover")} />
      )}

      {/* Mobile Menu Modal for About Page */}
      {showMenuModal && (isMobile || isTablet) && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-end">
          <div className="bg-white w-full max-h-[70vh] rounded-t-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-black">Menu</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowMenuModal(false)}
                className="text-black hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-12 text-left border-gray-200 hover:bg-gray-50"
                onClick={() => {
                  setShowMenuModal(false);
                  setView("discover");
                }}
              >
                <Search className="w-5 h-5 text-black" />
                <span className="text-black">Discover</span>
              </Button>
              
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-12 text-left border-gray-200 hover:bg-gray-50"
                onClick={() => {
                  setShowMenuModal(false);
                  setSelectedCollectionArtwork(null); // Reset to collection overview
                  setView("collection");
                }}
              >
                <Heart className="w-5 h-5 text-black" />
                <span className="text-black">My Collection</span>
              </Button>
              
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-12 text-left border-gray-200 hover:bg-gray-50"
                onClick={() => {
                  setShowMenuModal(false);
                  setView("for-artists");
                }}
              >
                <Palette className="w-5 h-5 text-black" />
                <span className="text-black">For Artists</span>
              </Button>
              
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-12 text-left border-gray-200 hover:bg-gray-50"
                onClick={() => {
                  setShowMenuModal(false);
                  setView("about");
                }}
              >
                <Info className="w-5 h-5 text-black" />
                <span className="text-black">About</span>
              </Button>
              
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-12 text-left border-gray-200 hover:bg-gray-50"
                onClick={() => {
                  setShowMenuModal(false);
                  window.location.href = '/contact';
                }}
              >
                <Mail className="w-5 h-5 text-black" />
                <span className="text-black">Contact</span>
              </Button>
              
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-12 text-left border-gray-200 hover:bg-gray-50"
                onClick={() => {
                  setShowMenuModal(false);
                  window.location.href = '/profile';
                }}
              >
                <User className="w-5 h-5 text-black" />
                <span className="text-black">Profile</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

