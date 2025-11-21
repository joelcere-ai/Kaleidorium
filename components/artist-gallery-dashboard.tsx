"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
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
} from "@/components/ui/alert-dialog";
import { SecureArtworkUpload } from "@/components/secure-artwork-upload";
import { validateURL } from "@/lib/validation";

interface ArtistGalleryDashboardProps {
  userId: string;
  isGallery: boolean;
  artistId?: string; // For artists, this is their own ID
}

export function ArtistGalleryDashboard({ userId, isGallery, artistId }: ArtistGalleryDashboardProps) {
  const [managedArtists, setManagedArtists] = useState<any[]>([]);
  const [artworks, setArtworks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddArtist, setShowAddArtist] = useState(false);
  const [showUploadArtwork, setShowUploadArtwork] = useState(false);
  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(null);
  const [newArtistName, setNewArtistName] = useState("");
  const [newArtistBio, setNewArtistBio] = useState("");
  const [newArtistWebsite, setNewArtistWebsite] = useState("");
  const [creatingArtist, setCreatingArtist] = useState(false);
  const [uploadingArtwork, setUploadingArtwork] = useState(false);
  const { toast } = useToast();

  // Artwork form state
  const [artworkTitle, setArtworkTitle] = useState("");
  const [artworkYear, setArtworkYear] = useState("");
  const [artworkMedium, setArtworkMedium] = useState("");
  const [artworkDimensions, setArtworkDimensions] = useState("");
  const [artworkDescription, setArtworkDescription] = useState("");
  const [artworkPrice, setArtworkPrice] = useState("");
  const [artworkCurrency, setArtworkCurrency] = useState("USD");
  const [artworkUrl, setArtworkUrl] = useState("");
  const [artworkImageUrl, setArtworkImageUrl] = useState<string | null>(null);
  
  // AI Description state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTimeout, setAiTimeout] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiDescription, setAiDescription] = useState("");
  const [artworkTags, setArtworkTags] = useState<string[]>([]);
  const [artworkGenre, setArtworkGenre] = useState<string>("");
  const [artworkStyle, setArtworkStyle] = useState<string>("");
  const [artworkSubject, setArtworkSubject] = useState<string>("");
  const [artworkColour, setArtworkColour] = useState<string>("");
  
  // Currency options (matching artist registration)
  const currencyOptions = [
    { value: "USD", label: "USD (US Dollar)" },
    { value: "EUR", label: "EUR (Euro)" },
    { value: "JPY", label: "JPY (Japanese Yen)" },
    { value: "GBP", label: "GBP (British Pound)" },
    { value: "AUD", label: "AUD (Australian Dollar)" },
    { value: "CAD", label: "CAD (Canadian Dollar)" },
    { value: "CHF", label: "CHF (Swiss Franc)" },
    { value: "CNY", label: "CNY (Chinese Yuan)" },
    { value: "BTC", label: "BTC (Bitcoin)" },
    { value: "ETH", label: "ETH (Ethereum)" },
    { value: "SOL", label: "SOL (Solana)" },
    { value: "USDT", label: "USDT (Tether)" },
    { value: "USDC", label: "USDC (USD Coin)" },
    { value: "BNB", label: "BNB (Binance Coin)" },
    { value: "XRP", label: "XRP (Ripple)" },
    { value: "DOGE", label: "DOGE (Dogecoin)" },
    { value: "ADA", label: "ADA (Cardano)" },
    { value: "MATIC", label: "MATIC (Polygon)" },
  ];
  
  // Artwork type options (matching artist registration)
  const artworkTypeOptions = [
    { label: 'Painting', options: [
      'Oil on Canvas', 'Acrylic on Canvas', 'Watercolor on Paper', 'Gouache on Paper', 'Encaustic', 'Tempera', 'Mixed Media Painting', 'Spray Paint', 'Ink Painting', 'Fresco'
    ]},
    { label: 'Drawing', options: [
      'Graphite', 'Charcoal', 'Ink Drawing', 'Colored Pencil', 'Chalk', 'Pastel (Soft)', 'Pastel (Oil)', 'Marker', 'Conté Crayon', 'Silverpoint'
    ]},
    { label: 'Sculpture', options: [
      'Bronze', 'Marble', 'Wood', 'Clay', 'Resin', 'Plaster', 'Mixed Media Sculpture', 'Found Object', 'Steel', 'Stone', 'Glass'
    ]},
    { label: 'Photography', options: [
      'Digital Photography (JPEG)', 'Digital Photography (PNG)', 'Film Photography (35mm, Medium Format)', 'Cyanotype', 'Silver Gelatin Print', 'Inkjet Print', 'C-Print', 'Daguerreotype', 'Photogram', 'Ambrotype'
    ]},
    { label: 'Digital Art', options: [
      'Picture - JPEG', 'Picture - PNG', 'Video - MP4', 'Video - MOV', '3D Render - OBJ', '3D Render - GLTF', 'Animation - GIF', 'Generative Art - Code-based', 'AR Artwork - USDZ', 'Interactive - Web-based'
    ]},
    { label: 'Printmaking', options: [
      'Lithograph', 'Woodcut', 'Linocut', 'Etching', 'Engraving', 'Screenprint (Silkscreen)', 'Monotype', 'Aquatint', 'Drypoint', 'Giclée Print'
    ]},
    { label: 'Mixed Media', options: [
      'Collage', 'Assemblage', 'Altered Book', 'Textiles + Paint', 'Found Materials + Canvas', '2D + 3D Hybrid Work', 'Recycled Materials', 'Photomontage', 'Digital + Analog Blend', 'Multimedia Installation'
    ]},
    { label: 'Installation', options: [
      'Site-Specific Installation', 'Light-Based Installation', 'Sound Installation', 'Interactive Installation', 'Video Installation', 'Environmental Installation', 'Mixed Media Installation', 'Kinetic Installation', 'Immersive Room', 'Projection Mapping'
    ]},
  ];

  useEffect(() => {
    if (userId) {
      loadData();
    }
  }, [userId, isGallery]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (isGallery) {
        // Load gallery's managed artists
        const { data: artists, error: artistsError } = await supabase
          .from("Artists")
          .select("*")
          .eq("managed_by_gallery_id", userId)
          .order("username", { ascending: true });

        if (artistsError) throw artistsError;
        setManagedArtists(artists || []);

        // Load artworks uploaded by this gallery
        const { data: artworksData, error: artworksError } = await supabase
          .from("Artwork")
          .select("*")
          .eq("uploaded_by_gallery_id", userId)
          .order("created_at", { ascending: false });

        if (artworksError) throw artworksError;
        setArtworks(artworksData || []);
      } else {
        // Load artist's own artworks
        const { data: artworksData, error: artworksError } = await supabase
          .from("Artwork")
          .select("*")
          .eq("artist_id", artistId || userId)
          .order("created_at", { ascending: false });

        if (artworksError) throw artworksError;
        setArtworks(artworksData || []);
      }
    } catch (error: any) {
      console.error("Error loading dashboard data:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateArtist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newArtistName.trim()) {
      toast({
        title: "Error",
        description: "Artist name is required",
        variant: "destructive",
      });
      return;
    }

    setCreatingArtist(true);
    try {
      // Check if artist name already exists
      const { data: existing } = await supabase
        .from("Artists")
        .select("username")
        .eq("username", newArtistName.trim())
        .single();

      if (existing) {
        toast({
          title: "Error",
          description: "An artist with this name already exists",
          variant: "destructive",
        });
        setCreatingArtist(false);
        return;
      }

      // Validate and format website URL if provided
      let websiteUrl = null;
      if (newArtistWebsite.trim()) {
        const urlResult = validateURL(newArtistWebsite.trim());
        if (urlResult.valid && urlResult.sanitized) {
          websiteUrl = urlResult.sanitized;
        } else {
          toast({
            title: "Invalid URL",
            description: urlResult.error || "Please enter a valid URL",
            variant: "destructive",
          });
          setCreatingArtist(false);
          return;
        }
      }

      // Generate a UUID for the artist (gallery-managed artists don't have auth users yet)
      // Using crypto.randomUUID() which is available in modern browsers
      let artistId: string;
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        artistId = crypto.randomUUID();
      } else {
        // Fallback for older browsers
        artistId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      }

      console.log('Creating artist with id:', artistId);

      // Create new artist profile managed by this gallery
      // Note: id is a generated UUID for gallery-managed artists (not linked to auth.users)
      // Artists who register themselves will set id = auth.uid() during registration
      const insertData = {
        id: artistId, // Generate UUID for gallery-managed artists
        username: newArtistName.trim(),
        firstname: newArtistName.trim().split(" ")[0] || newArtistName.trim(),
        surname: newArtistName.trim().split(" ").slice(1).join(" ") || "",
        biog: newArtistBio.trim() || null,
        website: websiteUrl,
        managed_by_gallery_id: userId,
        is_gallery: false,
      };

      console.log('Insert data:', insertData);

      const { data: newArtist, error } = await supabase
        .from("Artists")
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Error creating artist:', error);
        throw error;
      }

      toast({
        title: "Success",
        description: `Artist "${newArtistName}" created successfully`,
      });

      // Reset form
      setNewArtistName("");
      setNewArtistBio("");
      setNewArtistWebsite("");
      setShowAddArtist(false);
      loadData();
    } catch (error: any) {
      console.error("Error creating artist:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create artist",
        variant: "destructive",
      });
    } finally {
      setCreatingArtist(false);
    }
  };

  const handleDeleteArtist = async (artistId: string, artistName: string) => {
    try {
      // Check if artist has artworks
      const { data: artworks } = await supabase
        .from("Artwork")
        .select("id")
        .eq("artist_id", artistId)
        .limit(1);

      if (artworks && artworks.length > 0) {
        toast({
          title: "Cannot Delete",
          description: `Cannot delete "${artistName}" because they have artworks. Please delete artworks first.`,
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("Artists")
        .delete()
        .eq("id", artistId)
        .eq("managed_by_gallery_id", userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Artist "${artistName}" deleted successfully`,
      });

      loadData();
    } catch (error: any) {
      console.error("Error deleting artist:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete artist",
        variant: "destructive",
      });
    }
  };

  const handleUploadArtwork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!artworkTitle.trim() || !artworkImageUrl) {
      toast({
        title: "Error",
        description: "Artwork title and image are required",
        variant: "destructive",
      });
      return;
    }

    const targetArtistId = isGallery ? selectedArtistId : (artistId || userId);
    if (!targetArtistId) {
      toast({
        title: "Error",
        description: "Please select an artist",
        variant: "destructive",
      });
      return;
    }

    setUploadingArtwork(true);
    try {
      // Get artist info for the artwork
      const { data: artistData, error: artistError } = await supabase
        .from("Artists")
        .select("username")
        .eq("id", targetArtistId)
        .single();

      if (artistError || !artistData) throw new Error("Artist not found");

      // Validate and format URL if provided
      let artworkLinkUrl = null;
      if (artworkUrl.trim()) {
        const urlResult = validateURL(artworkUrl.trim());
        if (urlResult.valid && urlResult.sanitized) {
          artworkLinkUrl = urlResult.sanitized;
        } else {
          toast({
            title: "Invalid URL",
            description: urlResult.error || "Please enter a valid URL",
            variant: "destructive",
          });
          setUploadingArtwork(false);
          return;
        }
      }

      // Insert artwork
      const { error: artworkError } = await supabase
        .from("Artwork")
        .insert({
          artwork_title: artworkTitle.trim(),
          artist: artistData.username,
          artist_id: targetArtistId,
          year: artworkYear.trim() || new Date().getFullYear().toString(),
          medium: artworkMedium.trim() || null,
          dimensions: artworkDimensions.trim() || null,
          description: artworkDescription.trim() || null,
          price: artworkPrice.trim() || null,
          currency: artworkCurrency || null,
          artwork_link: artworkLinkUrl,
          artwork_image: artworkImageUrl,
          uploaded_by_gallery_id: isGallery ? userId : null,
          tags: artworkTags.join(", "),
          genre: artworkGenre || null,
          style: artworkStyle || null,
          subject: artworkSubject || null,
          colour: artworkColour || null,
        });

      if (artworkError) throw artworkError;

      toast({
        title: "Success",
        description: "Artwork uploaded successfully",
      });

      // Reset form
      setArtworkTitle("");
      setArtworkYear("");
      setArtworkMedium("");
      setArtworkDimensions("");
      setArtworkDescription("");
      setArtworkPrice("");
      setArtworkUrl("");
      setArtworkImageUrl(null);
      setAiDescription("");
      setArtworkTags([]);
      setArtworkGenre("");
      setArtworkStyle("");
      setArtworkSubject("");
      setArtworkColour("");
      setAiLoading(false);
      setAiTimeout(false);
      setAiError("");
      setShowUploadArtwork(false);
      if (isGallery) setSelectedArtistId(null);

      loadData();
    } catch (error: any) {
      console.error("Error uploading artwork:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload artwork",
        variant: "destructive",
      });
    } finally {
      setUploadingArtwork(false);
    }
  };

  const handleDeleteArtwork = async (artworkId: string, artworkTitle: string) => {
    try {
      const { error } = await supabase
        .from("Artwork")
        .delete()
        .eq("id", artworkId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Artwork "${artworkTitle}" deleted successfully`,
      });

      loadData();
    } catch (error: any) {
      console.error("Error deleting artwork:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete artwork",
        variant: "destructive",
      });
    }
  };

  const handleSecureArtworkUpload = (result: { url: string; metadata: any; tempFile?: any } | null) => {
    if (result) {
      setArtworkImageUrl(result.url);
      toast({ 
        title: "Secure artwork upload complete!", 
        description: "Your artwork is ready for AI description generation." 
      });
    } else {
      setArtworkImageUrl(null);
    }
  };

  const handleAIDescription = async () => {
    if (!artworkImageUrl) {
      toast({ title: "Please upload an image first.", variant: "destructive" });
      return;
    }
    setAiLoading(true);
    setAiTimeout(false);
    setAiError("");
    const timeoutId = setTimeout(() => setAiTimeout(true), 120000); // 2 minutes
    try {
      toast({ title: "The Kurator is studying your artwork..." });
      
      // Use The Kurator for complete analysis (description + tags)
      const kuratorRes = await fetch("/api/kurator-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          description: "", // Empty description - let Kurator analyze the image
          imageUrl: artworkImageUrl 
        }),
      });
      const kuratorResult = await kuratorRes.json();
      
      if (kuratorResult.error) {
        throw new Error(kuratorResult.error);
      }
      
      // Success - use Kurator's complete analysis
      const allTags = [
        kuratorResult.genre,
        kuratorResult.style,
        kuratorResult.subject,
        kuratorResult.colour,
        ...(kuratorResult.keywords || [])
      ].filter(tag => tag && tag.trim()); // Remove empty/null tags
      
      // Use the description from Kurator if available, otherwise create a basic one
      const description = kuratorResult.description || 
        `A ${kuratorResult.style || 'contemporary'} ${kuratorResult.genre || 'artwork'} featuring ${kuratorResult.subject || 'abstract elements'}.`;
      
      setAiDescription(description);
      setArtworkDescription(description);
      setArtworkTags(allTags);
      // Store individual tag categories for database
      setArtworkGenre(kuratorResult.genre || "");
      setArtworkStyle(kuratorResult.style || "");
      setArtworkSubject(kuratorResult.subject || "");
      setArtworkColour(kuratorResult.colour || "");
      
      toast({ 
        title: "AI analysis complete!", 
        description: `Generated description and ${allTags.length} tags.` 
      });
      
      setAiTimeout(false);
      setAiError("");
      clearTimeout(timeoutId);
    } catch (err: any) {
      setAiError("The Kurator is taking some time to study your artwork. If nothing happens in 2 minutes, click 'Generate AI Description' again. Failing that, you will need to enter your own description.");
      toast({ title: "AI analysis failed", description: err.message, variant: "destructive" });
      clearTimeout(timeoutId);
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Gallery: Manage Artists Section */}
      {isGallery && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>My Artists</CardTitle>
                <CardDescription>Manage artists in your gallery</CardDescription>
              </div>
              <Button onClick={() => setShowAddArtist(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Artist
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {showAddArtist ? (
              <form onSubmit={handleCreateArtist} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="artistName">Artist Name *</Label>
                  <Input
                    id="artistName"
                    value={newArtistName}
                    onChange={(e) => setNewArtistName(e.target.value)}
                    placeholder="Enter artist name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="artistBio">Biography (Optional)</Label>
                  <Textarea
                    id="artistBio"
                    value={newArtistBio}
                    onChange={(e) => setNewArtistBio(e.target.value)}
                    placeholder="Tell collectors about this artist..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="artistWebsite">Website/Social Media (Optional)</Label>
                  <Input
                    id="artistWebsite"
                    type="text"
                    value={newArtistWebsite}
                    onChange={(e) => setNewArtistWebsite(e.target.value)}
                    placeholder="www.example.com or https://example.com"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={creatingArtist}>
                    {creatingArtist ? "Creating..." : "Create Artist"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddArtist(false);
                      setNewArtistName("");
                      setNewArtistBio("");
                      setNewArtistWebsite("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-2">
                {managedArtists.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No artists yet. Click "Add Artist" to get started.</p>
                ) : (
                  managedArtists.map((artist) => (
                    <div
                      key={artist.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{artist.username}</p>
                        {artist.biog && (
                          <p className="text-sm text-muted-foreground line-clamp-1">{artist.biog}</p>
                        )}
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Artist</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{artist.username}"? This cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteArtist(artist.id, artist.username)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Upload Artwork Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>My Artworks</CardTitle>
              <CardDescription>
                {isGallery ? "Upload and manage artworks for your artists" : "Upload and manage your artworks"}
              </CardDescription>
            </div>
            <Button onClick={() => setShowUploadArtwork(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Upload Artwork
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showUploadArtwork ? (
            <form onSubmit={handleUploadArtwork} className="space-y-4">
              {isGallery && (
                <div className="space-y-2">
                  <Label htmlFor="selectArtist">Select Artist *</Label>
                  <select
                    id="selectArtist"
                    value={selectedArtistId || ""}
                    onChange={(e) => setSelectedArtistId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  >
                    <option value="">Choose an artist...</option>
                    {managedArtists.map((artist) => (
                      <option key={artist.id} value={artist.id}>
                        {artist.username}
                      </option>
                    ))}
                  </select>
                  {managedArtists.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Please add an artist first before uploading artwork.
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="artworkTitle">Artwork Title *</Label>
                <Input
                  id="artworkTitle"
                  value={artworkTitle}
                  onChange={(e) => setArtworkTitle(e.target.value)}
                  placeholder="Enter artwork title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Artwork Image *</Label>
                <SecureArtworkUpload
                  artworkTitle={artworkTitle || "Untitled"}
                  onArtworkSelect={handleSecureArtworkUpload}
                  currentImageUrl={artworkImageUrl || undefined}
                  maxFileSize={20}
                  enableAdvancedSecurity={true}
                  tempUpload={true}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="artworkYear">Year *</Label>
                  <Input
                    id="artworkYear"
                    value={artworkYear}
                    onChange={(e) => setArtworkYear(e.target.value)}
                    placeholder="2024"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="artworkMedium">Artwork Type *</Label>
                  <select
                    id="artworkMedium"
                    value={artworkMedium}
                    onChange={(e) => setArtworkMedium(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  >
                    <option value="">Select Artwork Type</option>
                    {artworkTypeOptions.map(group => (
                      <optgroup key={group.label} label={group.label}>
                        {group.options.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="artworkDimensions">Dimensions *</Label>
                <Input
                  id="artworkDimensions"
                  value={artworkDimensions}
                  onChange={(e) => setArtworkDimensions(e.target.value)}
                  placeholder="24 x 36 inches"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="artworkDescription">Description *</Label>
                <Textarea
                  id="artworkDescription"
                  value={artworkDescription || aiDescription}
                  onChange={(e) => setArtworkDescription(e.target.value)}
                  placeholder="Describe your artwork - the concept, technique, inspiration, and meaning behind the piece"
                  rows={4}
                  className="min-h-[120px]"
                  required
                />
                <div className="flex justify-start">
                  <Button 
                    type="button" 
                    onClick={handleAIDescription} 
                    className="mt-2 px-4 py-2 text-sm" 
                    disabled={aiLoading || !artworkImageUrl}
                  >
                    {aiLoading ? "The Kurator is studying..." : "Generate AI Description"}
                  </Button>
                </div>
                {artworkTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {artworkTags.map((tag) => (
                      <span key={tag} className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs">{tag}</span>
                    ))}
                  </div>
                )}
                {(aiTimeout || aiError) && (
                  <div className="text-yellow-700 bg-yellow-100 border border-yellow-300 rounded px-3 py-2 mt-2 text-sm">
                    The Kurator is taking some time to study your artwork. If nothing happens in 2 minutes, click "Generate AI Description" again. Failing that, you will need to enter your own description.
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="artworkPrice">Price *</Label>
                  <Input
                    id="artworkPrice"
                    value={artworkPrice}
                    onChange={(e) => setArtworkPrice(e.target.value)}
                    placeholder="1000"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="artworkCurrency">Currency *</Label>
                  <select
                    id="artworkCurrency"
                    value={artworkCurrency}
                    onChange={(e) => setArtworkCurrency(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  >
                    {currencyOptions.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="artworkUrl">
                  {isGallery ? "Link to your gallery or artwork page on your gallery" : "Artwork URL on your website"}
                </Label>
                <Input
                  id="artworkUrl"
                  type="text"
                  value={artworkUrl}
                  onChange={(e) => setArtworkUrl(e.target.value)}
                  placeholder={isGallery ? "https://yourgallery.com/artwork or www.yourgallery.com/artwork" : "https://yourwebsite.com/artwork or www.yourwebsite.com/artwork"}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={uploadingArtwork || (isGallery && !selectedArtistId)}>
                  {uploadingArtwork ? "Uploading..." : "Upload Artwork"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowUploadArtwork(false);
                    setArtworkTitle("");
                    setArtworkYear("");
                    setArtworkMedium("");
                    setArtworkDimensions("");
                    setArtworkDescription("");
                    setArtworkPrice("");
                    setArtworkUrl("");
                    setArtworkImageUrl(null);
                    setAiDescription("");
                    setArtworkTags([]);
                    setArtworkGenre("");
                    setArtworkStyle("");
                    setArtworkSubject("");
                    setArtworkColour("");
                    setAiLoading(false);
                    setAiTimeout(false);
                    setAiError("");
                    if (isGallery) setSelectedArtistId(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-2">
              {artworks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No artworks yet. Click "Upload Artwork" to get started.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {artworks.map((artwork) => (
                    <div key={artwork.id} className="border rounded-lg p-4 space-y-2">
                      <img
                        src={artwork.artwork_image}
                        alt={artwork.artwork_title}
                        className="w-full h-48 object-cover rounded"
                      />
                      <div>
                        <p className="font-medium">{artwork.artwork_title}</p>
                        <p className="text-sm text-muted-foreground">by {artwork.artist}</p>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="w-full">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Artwork</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{artwork.artwork_title}"? This cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteArtwork(artwork.id, artwork.artwork_title)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

