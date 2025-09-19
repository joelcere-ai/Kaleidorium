"use client"

import { useState, useCallback, useEffect } from "react"
import Image from "next/image"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Edit, RefreshCw, ArrowLeft, Trash2, Upload } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import type { Artwork } from "@/types/artwork"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

interface ProfilePageProps {
  collection: Artwork[]
  onReturnToDiscover: () => void
}

export function ProfilePage({ collection, onReturnToDiscover }: ProfilePageProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [profilePicture, setProfilePicture] = useState<string | null>(null)
  const [collector, setCollector] = useState<any>(null)
  const [collectorLoading, setCollectorLoading] = useState(true)
  const { toast } = useToast()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [editEmail, setEditEmail] = useState("")
  const [editPassword, setEditPassword] = useState("")
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [signInError, setSignInError] = useState("");
  const [signingIn, setSigningIn] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [resetting, setResetting] = useState(false);
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const defaultTab = tabParam === "account" ? "account" : "preferences";
  const [artistArtworks, setArtistArtworks] = useState<any[]>([]);
  const [deletingArtworkId, setDeletingArtworkId] = useState<string | null>(null);
  const [isDeletingArtwork, setIsDeletingArtwork] = useState(false);
  const [userCollection, setUserCollection] = useState<Artwork[]>([]);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [emailChangeLoading, setEmailChangeLoading] = useState(false);
  const [emailChangeMessage, setEmailChangeMessage] = useState("");
  const [emailChangeError, setEmailChangeError] = useState("");
  const [artistData, setArtistData] = useState<any>(null);
  const [editingArtist, setEditingArtist] = useState(false);
  const [editArtistBiog, setEditArtistBiog] = useState("");
  const [editArtistWebsite, setEditArtistWebsite] = useState("");
  const [isArtist, setIsArtist] = useState(false);
  const [portfolioArtworks, setPortfolioArtworks] = useState<any[]>([]);
  const [portfolioLoading, setPortfolioLoading] = useState(false);

  const handleProfilePictureUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.error('No authenticated user found');
        toast({
          title: "Authentication Error",
          description: "Please sign in to upload a profile picture.",
          variant: "destructive",
        });
        return;
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload a JPG, PNG, GIF, or WebP image.",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload an image smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }

      console.log('Attempting upload with user:', user.id);
      console.log('File details:', {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified
      });

      // Create a unique file name
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const fileName = `${user.id}_${Date.now()}.${fileExt}`
      
      console.log('Uploading to path:', fileName);

      // Simple direct upload
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(fileName, file, {
          upsert: true
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      console.log('Upload successful:', uploadData);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(fileName)

      console.log('Generated public URL:', publicUrl);

      // Update user profile with new picture URL
      const { error: updateError } = await supabase
        .from('Collectors')
        .update({ profilepix: publicUrl })
        .eq('user_id', user.id)
        .single()

      if (updateError) {
        console.error('Profile update error:', updateError);
        throw updateError;
      }

      setProfilePicture(publicUrl)
      toast({
        title: "Success",
        description: "Your profile picture has been updated.",
      })
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error 
          ? `Error: ${error.message}` 
          : "Failed to upload profile picture. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }, [toast])

  // Fetch profile picture on mount
  useEffect(() => {
    const fetchProfilePicture = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('Collectors')
        .select('profilepix')
        .eq('user_id', user.id)
        .single()

      if (data?.profilepix) {
        setProfilePicture(data.profilepix)
      }
    }

    fetchProfilePicture()
  }, [])

  // Fetch collector profile on mount
  useEffect(() => {
    const fetchCollector = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCollectorLoading(true);
      const { data, error } = await supabase
        .from('Collectors')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (!error && data) setCollector(data);
      setCollectorLoading(false);
    };
    fetchCollector();
  }, []);

  // Helper: check if user is authenticated
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
  }, []);

  // Listen for auth state changes and refresh user/collector data
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        // Fetch collector profile for the new user
        setCollectorLoading(true);
        let { data, error } = await supabase
          .from('Collectors')
          .select('*')
          .eq('user_id', session.user.id)
          .single();
        // If no collector record, create one
        if (error && error.code === 'PGRST116') { // Not found
          const { error: insertError } = await supabase.from('Collectors').insert({
            user_id: session.user.id,
            email: session.user.email,
            is_temporary: false,
            preferences: {
              artists: {}, genres: {}, styles: {}, subjects: {}, colors: {}, priceRanges: {}, interactionCount: 0, viewed_artworks: []
            }
          });
          if (!insertError) {
            // Try fetching again
            ({ data, error } = await supabase
              .from('Collectors')
              .select('*')
              .eq('user_id', session.user.id)
              .single());
          }
        }
        if (!error && data) setCollector(data);
        setCollectorLoading(false);
      } else {
        setUser(null);
        setCollector(null);
      }
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  // Fetch artist's artworks if user is artist
  useEffect(() => {
    if (collector?.role === 'artist') {
      const fetchArtworks = async () => {
        const { data, error } = await supabase
          .from('Artwork')
          .select('*')
          .eq('artist_id', collector.user_id);
        if (error) {
          console.error('Error fetching artist artworks:', error);
        } else {
          setArtistArtworks(data);
        }
      };
      fetchArtworks();
    }
  }, [collector]);

  // Fetch artist-specific data if user is an artist
  useEffect(() => {
    const fetchArtist = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !collector || collector.role !== "artist") return;

      const { data, error } = await supabase
        .from('Artists')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        setArtistData(data);
        setEditArtistBiog(data.biog || "");
        setEditArtistWebsite(data.website || "");
      }
    };

    fetchArtist();
  }, [collector]);

  // Check if user is an artist (regardless of collector role)
  useEffect(() => {
    const checkIfArtist = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('Artists')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        setIsArtist(true);
        fetchPortfolioArtworks(user.id);
      }
    };

    checkIfArtist();
  }, []);

  // Fetch portfolio artworks for artists
  const fetchPortfolioArtworks = async (artistId: string) => {
    setPortfolioLoading(true);
    try {
      // Use the analytics API to get artworks with real statistics
      const response = await fetch(`/api/artwork-analytics?artist_id=${artistId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch portfolio data');
      }
      
      const result = await response.json();
      setPortfolioArtworks(result.data || []);
    } catch (error) {
      console.error('Error fetching portfolio artworks:', error);
      // Fallback to basic artwork fetch if analytics API fails
      try {
        const { data: artworks, error } = await supabase
          .from('Artwork')
          .select('*')
          .eq('artist_id', artistId);

        if (!error && artworks) {
          const artworksWithStats = artworks.map(artwork => ({
            ...artwork,
            views: 0,
            leads: 0,
            likes: 0,
            dislikes: 0,
            adds_to_collection: 0,
            artwork_image: artwork.artwork_image || "/placeholder.svg"
          }));
          setPortfolioArtworks(artworksWithStats);
        }
      } catch (fallbackError) {
        console.error('Error in fallback fetch:', fallbackError);
      }
    } finally {
      setPortfolioLoading(false);
    }
  };

  const [insights, setInsights] = useState({
    summary: "Click 'Generate Insights' to analyze your collection.",
    aesthetic_profile: "",
    collecting_pattern: "",
    topArtists: [],
    topTags: [],
    priceRange: "N/A",
    recommendations: [],
    preferredMediums: []
  })

  const generateInsights = async () => {
    setIsGenerating(true)
    try {
      // First get basic analysis for stats
      const basicAnalysis = analyzeCollection()
      
      // Then get AI-powered insights if collection has artworks
      if (userCollection.length > 0) {
        const response = await fetch('/api/profile-insights', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            collection: userCollection
          })
        })
        
        if (response.ok) {
          const aiInsights = await response.json()
          setInsights({
            ...basicAnalysis,
            summary: aiInsights.summary,
            aesthetic_profile: aiInsights.aesthetic_profile,
            collecting_pattern: aiInsights.collecting_pattern,
            recommendations: aiInsights.recommendations
          })
        } else {
          // Fallback to basic analysis if AI fails
          setInsights(basicAnalysis)
          toast({
            title: "AI Analysis Unavailable",
            description: "Using basic analysis instead.",
            variant: "default"
          })
        }
      } else {
        setInsights(basicAnalysis)
      }
    } catch (error) {
      console.error('Error generating insights:', error)
      setInsights(analyzeCollection())
      toast({
        title: "Analysis Error",
        description: "Using basic analysis instead.",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const analyzeCollection = (): any => {
    if (userCollection.length === 0) {
      return {
        summary: "Your collection is empty. Add some artworks to get insights.",
        topArtists: [],
        topTags: [],
        priceRange: "N/A",
        recommendations: [],
        preferredMediums: []
      };
    }

    const artistCounts: Record<string, number> = {};
    const tagCounts: Record<string, number> = {};
    const mediumCounts: Record<string, number> = {};
    const prices: number[] = [];

    userCollection.forEach((artwork) => {
      if (artwork.artist) {
        artistCounts[artwork.artist] = (artistCounts[artwork.artist] || 0) + 1;
      }
      if (artwork.tags && Array.isArray(artwork.tags)) {
      artwork.tags.forEach((tag) => {
          if (tag) tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
      if (artwork.medium) {
        mediumCounts[artwork.medium] = (mediumCounts[artwork.medium] || 0) + 1;
      }
      if (artwork.price) {
          const price = parseFloat(artwork.price.replace(/[^0-9.-]+/g, ""));
          if(!isNaN(price)) prices.push(price);
      }
    });

    const getTopItems = (counts: Record<string, number>, count: number) =>
      Object.entries(counts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, count)
        .map(([name]) => name);

    const topArtists = getTopItems(artistCounts, 3);
    const topTags = getTopItems(tagCounts, 5);
    const preferredMediums = getTopItems(mediumCounts, 3);
    
    const priceRange = prices.length > 0 
      ? `$${Math.min(...prices).toLocaleString()} - $${Math.max(...prices).toLocaleString()}` 
      : "N/A";

    let summary = `Your diverse collection spans multiple styles including ${topTags.slice(0, 3).join(", ")}, showing an eclectic taste in digital art.`;
    if (userCollection.length === 1) {
      summary = `Your collection features a single piece by ${topArtists[0]}. This ${topTags[0] || 'abstract'} artwork suggests you're just beginning to explore the world of digital art.`;
    }

    const recommendations = [];
    if (topTags.includes("Abstract")) {
      recommendations.push("Explore more works in the generative and abstract genres.");
    }
    if (recommendations.length === 0) {
      recommendations.push("Explore more works in the Discover section to refine your preferences");
    }

    return {
      summary,
      topArtists,
      topTags,
      priceRange,
      preferredMediums,
      recommendations,
    };
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  }

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      if (!user) {
        throw new Error("User not found for deletion.");
      }

      // SECURITY: Let the server verify the session instead of trusting client data
      // The server will extract the user ID from the authenticated session
      const response = await fetch('/api/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }), // Server will verify this matches session
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please sign in again to delete your account.');
        } else if (response.status === 403) {
          throw new Error('You can only delete your own account.');
        }
        throw new Error(result.error || 'Failed to delete account');
      }

      toast({
        title: "Account Deleted",
        description: result.message + (result.details?.artworksDeleted ? ` (${result.details.artworksDeleted} artworks removed from all collections)` : ''),
      });

      // The API handles sign out, so we just need to redirect
      router.push('/');
    } catch (error: any) {
      console.error("Deletion failed:", error);
      toast({
        title: "Deletion Failed",
        description: `Could not delete account: ${error.message}. Please contact support.`,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSavePersonalInfo = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) {
      toast({ title: "Error", description: "You must be signed in to update your profile.", variant: "destructive" });
      return;
    }
    const updateData: { email?: string; password?: string } = {};
    if (editEmail !== user.email) {
      updateData.email = editEmail;
    }
    if (editPassword) {
      updateData.password = editPassword;
    }

    if (Object.keys(updateData).length > 0) {
      const { error } = await supabase.auth.updateUser(updateData);
      if (error) {
        toast({ title: "Error updating profile", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Profile updated", description: "Your personal information has been saved." });
        if (updateData.password) {
          setEditPassword("");
        }
      }
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSigningIn(true);
    setSignInError("");
    
    // Custom validation
    if (!signInEmail.trim()) {
      setSignInError("Please enter your email address");
      setSigningIn(false);
      return;
    }
    
    if (!signInPassword.trim()) {
      setSignInError("Please enter your password");
      setSigningIn(false);
      return;
    }
    
    const { error } = await supabase.auth.signInWithPassword({
      email: signInEmail,
      password: signInPassword,
    });
    if (error) {
      setSignInError(error.message);
    } else {
      router.refresh();
    }
    setSigningIn(false);
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetting(true);
    setResetMessage("");
    
    // Custom validation
    if (!resetEmail.trim()) {
      setResetMessage("Please enter your email address");
      setResetting(false);
      return;
    }
    
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/auth/password-reset-callback`,
    });
    if (error) {
      setResetMessage(error.message);
    } else {
      setResetMessage("Password reset link sent! Please check your email.");
    }
    setResetting(false);
  };

  const handleDeleteArtwork = async (artworkId: string) => {
    setIsDeletingArtwork(true);
    const { error } = await supabase.from('Artwork').delete().match({ id: artworkId });
    if (error) {
      toast({ title: 'Error', description: 'Failed to delete artwork.', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Artwork deleted.' });
      setArtistArtworks(prev => prev.filter(art => art.id !== artworkId));
    }
    setIsDeletingArtwork(false);
    setDeletingArtworkId(null);
  };

    const fetchUserCollection = async () => {
      if (!user) return;
      const { data: collectionRows, error: collectionError } = await supabase
        .from('Collection')
        .select('artwork_id')
        .eq('user_id', user.id);
      if (collectionError) return;
      const artworkIds = collectionRows?.map(row => row.artwork_id) || [];
      if (artworkIds.length > 0) {
        const { data: artworks, error: artworkError } = await supabase
          .from('Artwork')
          .select('*')
          .in('id', artworkIds);
        if (!artworkError) {
          const collection = artworks || [];
          setUserCollection(collection);
          // Auto-generate insights when collection is loaded
          if (collection.length > 0) {
            setTimeout(() => generateInsights(), 1000); // Small delay to ensure UI is ready
          }
        }
      } else {
        setUserCollection([]);
      }
    };
    useEffect(() => {
        fetchUserCollection();
    }, [user]);

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("Email change form submitted");
    setEmailChangeLoading(true);
    setEmailChangeMessage("");
    setEmailChangeError("");
    
    if (!newEmail || !newEmail.trim()) {
      setEmailChangeError("Please enter your new email.");
      setEmailChangeLoading(false);
      return;
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      setEmailChangeError("Please enter a valid email address.");
      setEmailChangeLoading(false);
      return;
    }

    try {
      console.log("Starting direct database email update...");
      console.log("New email:", newEmail);
      
      // Use the existing user object instead of making auth call
      if (!user) {
        setEmailChangeError("Session expired. Please sign in again.");
      setEmailChangeLoading(false);
      return;
    }

      // Check if same email
      if (user.email === newEmail) {
        setEmailChangeError("The new email is the same as your current email.");
      setEmailChangeLoading(false);
      return;
      }

      console.log("Current user ID:", user.id);
      console.log("Current user email:", user.email);
      
      // Use API route to update email (bypasses RLS issues)
      console.log("Calling API route to update email...");
      console.log("User ID:", user.id);
      console.log("New email:", newEmail);
      
      const response = await fetch('/api/update-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newEmail, userId: user.id }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        console.error("API update error:", result.error);
        setEmailChangeError(`Failed to update your email: ${result.error}`);
        setEmailChangeLoading(false);
        return;
      }

      console.log("Email updated successfully via API");

      console.log("Email update completed successfully");
      
      // Success
      setNewEmail("");
      setShowEmailModal(false);
      setEditEmail(newEmail);
      
      toast({
        title: "Email Updated",
        description: "Your email has been updated successfully.",
      });
       
    } catch (error: any) {
      console.error("Email change error:", error);
      setEmailChangeError("An unexpected error occurred. Please try again.");
    } finally {
    setEmailChangeLoading(false);
    }
  };

  const handleSaveArtistInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !artistData) return;

    try {
      const { error } = await supabase
        .from('Artists')
        .update({
          biog: editArtistBiog,
          website: editArtistWebsite
        })
        .eq('id', user.id);

      if (error) throw error;

      setArtistData({
        ...artistData,
        biog: editArtistBiog,
        website: editArtistWebsite
      });
      setEditingArtist(false);

      toast({
        title: "Profile Updated",
        description: "Your artist information has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 flex items-center justify-center" style={{minHeight: 'calc(100vh - 80px)'}}>
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Your Profile</CardTitle>
            <CardDescription>Sign in to manage your collection and preferences.</CardDescription>
          </CardHeader>
          <CardContent>
            {!showReset ? (
              <form onSubmit={handleSignIn} className="space-y-4" noValidate>
                <div className="space-y-2">
                  <Label htmlFor="signInEmail">Email</Label>
                  <Input 
                    id="signInEmail" 
                    name="email"
                    type="email" 
                    value={signInEmail} 
                    onChange={e => setSignInEmail(e.target.value)} 
                    required 
                    autoComplete="email"
                    placeholder="Enter your email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signInPassword">Password</Label>
                  <Input 
                    id="signInPassword" 
                    name="password"
                    type="password" 
                    value={signInPassword} 
                    onChange={e => setSignInPassword(e.target.value)} 
                    required 
                    autoComplete="current-password"
                    placeholder="Enter your password"
                  />
                </div>
                {signInError && <p className="text-sm text-red-500">{signInError}</p>}
                <Button type="submit" className="w-full" disabled={signingIn}>{signingIn ? 'Signing In...' : 'Sign In'}</Button>
                <Button type="button" variant="link" className="p-0 h-auto w-full" onClick={() => setShowReset(true)}>
                  Forgot your password?
                </Button>
              </form>
            ) : (
              <form onSubmit={handlePasswordReset} className="space-y-4" noValidate>
                <div className="space-y-2">
                  <Label htmlFor="resetEmail">Email</Label>
                  <Input 
                    id="resetEmail" 
                    name="resetEmail"
                    type="email" 
                    value={resetEmail} 
                    onChange={e => setResetEmail(e.target.value)} 
                    required 
                    autoComplete="email"
                    placeholder="Enter your email" 
                  />
                </div>
                <Button type="submit" className="w-full" disabled={resetting}>{resetting ? 'Sending...' : 'Send Reset Link'}</Button>
                {resetMessage && <p className="text-sm text-muted-foreground">{resetMessage}</p>}
                <Button type="button" variant="link" className="p-0 h-auto w-full" onClick={() => setShowReset(false)}>
                  Back to Sign In
                </Button>
              </form>
            )}
            <Separator className="my-4" />
            <p className="text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Button variant="link" className="p-0 h-auto" onClick={() => router.push('/register')}>
                Register here
              </Button>
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <Button variant="ghost" onClick={onReturnToDiscover}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Discovery
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-1/4">
            <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="relative h-24 w-24 rounded-full bg-muted flex items-center justify-center overflow-hidden group mb-4">
                    <Image
                      src={profilePicture || "/placeholder.svg"}
                      alt="Profile"
                      fill
                      className="object-cover"
                    />
                    <label 
                      htmlFor="profile-picture-upload"
                      className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
                    >
                      <Upload className="h-6 w-6 text-white" />
                    </label>
                    <input
                      type="file"
                      id="profile-picture-upload"
                      accept="image/*"
                      className="hidden"
                      onChange={handleProfilePictureUpload}
                      disabled={isUploading}
                    />
                </div>
                <h2 className="text-lg font-semibold">{collector?.username || user?.email}</h2>
                <p className="text-sm text-muted-foreground">{isArtist ? 'Artist' : (collector?.role || 'Collector')}</p>
                <Button variant="outline" className="mt-4 w-full" onClick={handleLogout}>
                  Logout
                      </Button>
                </div>
              </CardContent>
            </Card>
          </div>

        <div className="lg:w-3/4">
          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className={`grid w-full ${isArtist ? 'grid-cols-3' : 'grid-cols-2'}`}>
              <TabsTrigger value="preferences">Art Preferences</TabsTrigger>
              {isArtist && <TabsTrigger value="portfolio">Portfolio</TabsTrigger>}
              <TabsTrigger value="account">Account Information</TabsTrigger>
            </TabsList>

            <TabsContent value="preferences" className="mt-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Your Art Preferences</CardTitle>
                  </div>
                  <Button className="bg-black text-white hover:bg-gray-800" size="sm" onClick={generateInsights} disabled={isGenerating}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${isGenerating ? "animate-spin" : ""}`} />
                    Refresh Insights
                  </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-6">
                    {/* AI-Generated Collection Summary */}
                    <div>
                      <h3 className="text-lg font-medium mb-3">Collection Overview</h3>
                      <p className="text-muted-foreground leading-relaxed">{insights.summary}</p>
                    </div>

                    {/* AI-Generated Aesthetic Profile */}
                    {insights.aesthetic_profile && (
                      <div>
                        <h3 className="text-lg font-medium mb-3">Your Aesthetic Profile</h3>
                        <p className="text-muted-foreground leading-relaxed">{insights.aesthetic_profile}</p>
                      </div>
                    )}

                    {/* AI-Generated Collecting Pattern */}
                    {insights.collecting_pattern && (
                      <div>
                        <h3 className="text-lg font-medium mb-3">Collecting Pattern</h3>
                        <p className="text-muted-foreground leading-relaxed">{insights.collecting_pattern}</p>
                      </div>
                    )}

                    <Separator />

                    {/* Collection Statistics */}
                    <div>
                      <h3 className="text-lg font-medium mb-4">Collection Statistics</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                          <h4 className="text-sm font-medium mb-2">Top Artists</h4>
                        {insights.topArtists.length > 0 ? (
                          <ul className="list-disc pl-5 text-sm text-muted-foreground">
                            {insights.topArtists.map((artist: string) => (
                              <li key={artist}>{artist}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted-foreground">No artists in collection yet</p>
                        )}
                      </div>

                      <div>
                          <h4 className="text-sm font-medium mb-2">Preferred Styles</h4>
                        <div className="flex flex-wrap gap-2">
                          {insights.topTags.length > 0 ? (
                            insights.topTags.map((tag) => (
                              <Badge key={tag} variant="secondary">
                                {tag}
                              </Badge>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground">No styles in collection yet</p>
                          )}
                      </div>
                    </div>

                      <div>
                          <h4 className="text-sm font-medium mb-2">Preferred Mediums</h4>
                        {insights.preferredMediums.length > 0 ? (
                          <ul className="list-disc pl-5 text-sm text-muted-foreground">
                            {insights.preferredMediums.map((medium) => (
                              <li key={medium}>{medium}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted-foreground">No mediums in collection yet</p>
                        )}
                      </div>

                      <div>
                          <h4 className="text-sm font-medium mb-2">Price Range</h4>
                        <p className="text-sm text-muted-foreground">{insights.priceRange}</p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* AI-Generated Recommendations */}
                    <div>
                      <h3 className="text-lg font-medium mb-3">Personalized Recommendations</h3>
                      {insights.recommendations.length > 0 ? (
                        <ul className="space-y-2">
                          {insights.recommendations.map((recommendation, index) => (
                            <li key={index} className="flex items-start space-x-2">
                              <span className="text-primary mt-1">•</span>
                              <span className="text-muted-foreground">{recommendation}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-muted-foreground">
                          Add artworks to your collection to get personalized recommendations
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Portfolio Tab - Only for Artists */}
            {isArtist && (
              <TabsContent value="portfolio" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Your Portfolio</CardTitle>
                    <CardDescription>View your uploaded artworks and their performance statistics</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {portfolioLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                        Loading portfolio...
                      </div>
                    ) : portfolioArtworks.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground mb-4">You haven't uploaded any artworks yet.</p>
                        <Button 
                          onClick={() => router.push('/for-artists/register')}
                          variant="outline"
                        >
                          Upload Your First Artwork
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                        {portfolioArtworks.map((artwork) => (
                          <Card key={artwork.id} className="overflow-hidden">
                            <div className="relative aspect-square">
                              <Image
                                src={artwork.artwork_image}
                                alt={artwork.artwork_title || 'Untitled'}
                                fill
                                className="object-cover rounded-t-lg"
                              />
                            </div>
                            <CardContent className="p-4 space-y-3">
                              <div>
                                <h3 className="font-medium text-lg truncate">
                                  {artwork.artwork_title || 'Untitled'}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  {artwork.medium || 'Medium not specified'}
                                </p>
                              </div>
                              
                              <div className="space-y-2">
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-muted-foreground">Views:</span>
                                  <Badge variant="secondary">{artwork.views.toLocaleString()}</Badge>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-muted-foreground">Leads:</span>
                                  <Badge variant="secondary">{artwork.leads.toLocaleString()}</Badge>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-muted-foreground">Conversion:</span>
                                  <Badge variant="outline">
                                    {artwork.views > 0 ? ((artwork.leads / artwork.views) * 100).toFixed(1) : 0}%
                                  </Badge>
                                </div>
                              </div>
                              
                              <Separator />
                              
                              <div className="text-muted-foreground space-y-1">
                                <p className="text-xs"><strong>Views:</strong> Number of times shown to collectors in discovery</p>
                                <p className="text-xs"><strong>Leads:</strong> Clicks on "View Artwork Page" button</p>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            <TabsContent value="account" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Personal Information</CardTitle>
                  <CardDescription>Update your account details here.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSavePersonalInfo} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="flex gap-2 items-center">
                        <Input id="email" type="email" value={editEmail} disabled />
                        <AlertDialog 
                          open={showEmailModal} 
                          onOpenChange={(open) => {
                            if (!open) {
                              // Reset form state when modal is closed
                              setNewEmail("");
                              setEmailChangeError("");
                              setEmailChangeMessage("");
                              setEmailChangeLoading(false);
                            }
                            setShowEmailModal(open);
                          }}
                        >
                          <AlertDialogTrigger asChild>
                            <Button type="button" variant="outline" size="sm">Change Email</Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Change Email</AlertDialogTitle>
                              <AlertDialogDescription>Enter your new email address. You will receive a confirmation link at your new email address.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <form onSubmit={handleEmailChange} className="space-y-4">
                              <div>
                                <Label htmlFor="newEmail">New Email</Label>
                                <Input id="newEmail" type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} required />
                        </div>
                              {emailChangeError && <p className="text-sm text-red-600">{emailChangeError}</p>}
                              {emailChangeMessage && <p className="text-sm text-green-600">{emailChangeMessage}</p>}
                              <AlertDialogFooter>
                                <AlertDialogCancel 
                                  type="button" 
                                  onClick={() => {
                                    setNewEmail("");
                                    setEmailChangeError("");
                                    setEmailChangeMessage("");
                                    setEmailChangeLoading(false);
                                    setShowEmailModal(false);
                                  }}
                                  disabled={emailChangeLoading}
                                >
                                  Cancel
                                </AlertDialogCancel>
                                {emailChangeLoading && (
                                  <Button 
                                    type="button" 
                                    variant="outline"
                                    onClick={() => {
                                      console.log("Force reset loading state");
                                      setEmailChangeLoading(false);
                                      setEmailChangeError("Request timed out. Please try again.");
                                    }}
                                  >
                                    Reset
                                  </Button>
                                )}
                                <Button type="submit" disabled={emailChangeLoading}>{emailChangeLoading ? "Submitting..." : "Submit"}</Button>
                              </AlertDialogFooter>
                            </form>
                          </AlertDialogContent>
                        </AlertDialog>
                        </div>
                      <p className="text-sm text-muted-foreground">
                        To change your email, click "Change Email" and follow the instructions.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input id="password" type="password" placeholder="••••••••" disabled />
                      <p className="text-sm text-muted-foreground">
                        To change your password, please use the 'Forgot Password' link on the login page.
                      </p>
                    </div>
                    <Button type="submit" disabled>Save Changes</Button>
                  </form>
                </CardContent>
              </Card>

              {/* Artist Profile Section */}
              {isArtist && artistData && (
                <Card className="mt-6">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Artist Information</CardTitle>
                      <CardDescription>Update your artist profile details.</CardDescription>
                    </div>
                    {!editingArtist && (
                      <Button variant="outline" size="sm" onClick={() => setEditingArtist(true)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent>
                    {editingArtist ? (
                      <form onSubmit={handleSaveArtistInfo} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="artistBiog">Describe yourself as an artist</Label>
                          <Textarea 
                            id="artistBiog"
                            value={editArtistBiog}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditArtistBiog(e.target.value)}
                            placeholder="Tell collectors about your artistic journey and style..."
                            rows={4}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="artistWebsite">Primary social media or website</Label>
                          <Input 
                            id="artistWebsite"
                            type="url"
                            value={editArtistWebsite}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditArtistWebsite(e.target.value)}
                            placeholder="https://yourwebsite.com or social media link"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button type="submit">Save Changes</Button>
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => {
                              setEditingArtist(false);
                              setEditArtistBiog(artistData.biog || "");
                              setEditArtistWebsite(artistData.website || "");
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium">Artist Biography</Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            {artistData.biog || "No biography provided"}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Website/Social Media</Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            {artistData.website ? (
                              <a 
                                href={artistData.website} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                {artistData.website}
                              </a>
                            ) : (
                              "No website provided"
                            )}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-lg">Account Management</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="border border-red-500 bg-red-50 rounded p-4">
                    <h3 className="text-lg font-semibold text-red-700 mb-2">Danger Zone</h3>
                    <p className="text-sm text-red-700 mb-4">
                      Permanently delete your account and all associated data. This action cannot be undone.
                      {isArtist && (
                        <span className="block mt-2 font-semibold">
                          ⚠️ As an artist, this will also remove all your artworks from all users' collections and delete all your uploaded images.
                        </span>
                      )}
                    </p>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive">Delete Account</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your account and remove your data from our servers.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteAccount} disabled={isDeleting}>
                            {isDeleting ? "Deleting..." : "Continue"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
            </div>
                </CardContent>
              </Card>
        </TabsContent>
      </Tabs>
        </div>
      </div>
    </div>
  )
}

