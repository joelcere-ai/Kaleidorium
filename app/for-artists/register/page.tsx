"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
// @ts-ignore: No type declarations for 'react-select-country-list'
import countryList from 'react-select-country-list';
import Link from "next/link";
import { send as sendEmailJS } from '@emailjs/browser';
import { v4 as uuidv4 } from 'uuid';
import { ProfilePictureUpload } from "@/components/profile-picture-upload";
import { SecureArtworkUpload } from "@/components/secure-artwork-upload";
import { uploadProfilePicture, type OptimizedImage } from "@/lib/image-utils";

const countries: { value: string; label: string }[] = countryList().getData();

interface KuratorTags {
  genre: string | null;
  style: string | null;
  subject: string | null;
  colour: string | null;
  keywords: string[];
}

export default function ArtistRegisterPageWrapper() {
  return (
    <Suspense>
      <ArtistRegisterPage />
    </Suspense>
  );
}

function ArtistRegisterPage() {
  const [artist, setArtist] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    firstname: "",
    surname: "",
    email: "",
    country: "",
    biog: "",
    website: "",
  });
  const [artwork, setArtwork] = useState({
    title: "",
    year: "",
    image: null as File | null,
    description: "",
    price: "",
    currency: "USD",
    url: "",
    tags: [] as string[],
    medium: "",
    dimensions: "",
    genre: "" as string,
    style: "" as string,
    subject: "" as string,
    colour: "" as string,
  });
  const [aiDescription, setAIDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [aiLoading, setAiLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [aiTimeout, setAiTimeout] = useState(false);
  const [aiError, setAiError] = useState("");
  const [tagWarning, setTagWarning] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteToken, setInviteToken] = useState("");
  const [isInviteVerified, setIsInviteVerified] = useState(false);
  const [inviteError, setInviteError] = useState("");

  // Check for URL parameters on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const emailParam = urlParams.get('email');
    const tokenParam = urlParams.get('token');
    
    if (emailParam) {
      setInviteEmail(emailParam);
    }
    if (tokenParam) {
      setInviteToken(tokenParam);
    }
  }, []);
  const [profileImage, setProfileImage] = useState<OptimizedImage | null>(null);

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

  const handleArtistChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setArtist({ ...artist, [e.target.name]: e.target.value });
  };
  const handleArtworkChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    // Handle non-image fields
    setArtwork({ ...artwork, [e.target.name]: e.target.value });
  };

  const handleSecureArtworkUpload = (result: { url: string; metadata: any; tempFile?: any } | null) => {
    if (result) {
      setImageUrl(result.url);
      setArtwork(prev => ({ ...prev, image: null })); // We'll use the URL instead
      toast({ 
        title: "Secure artwork upload complete!", 
        description: "Your artwork is ready for AI description generation." 
      });
    } else {
      setImageUrl("");
      setArtwork(prev => ({ ...prev, image: null }));
    }
  };

  const handleAIDescription = async () => {
    if (!imageUrl) {
      toast({ title: "Please upload an image first.", variant: "destructive" });
      return;
    }
    setAiLoading(true);
    setAiTimeout(false);
    setAiError("");
    const timeoutId = setTimeout(() => setAiTimeout(true), 120000); // 2 minutes
    try {
      toast({ title: "AI is analyzing your artwork..." });
      
      // Use only The Kurator for complete analysis (description + tags)
      const kuratorRes = await fetch("/api/kurator-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          description: "", // Empty description - let Kurator analyze the image
          imageUrl 
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
      
      setAIDescription(description);
      setArtwork(a => ({ 
        ...a, 
        description: description, 
        tags: allTags,
        // Store individual tag categories for database
        genre: kuratorResult.genre,
        style: kuratorResult.style,
        subject: kuratorResult.subject,
        colour: kuratorResult.colour
      }));
      
      toast({ 
        title: "AI analysis complete!", 
        description: `Generated description and ${allTags.length} tags.` 
      });
      
      setAiTimeout(false);
      setAiError("");
      clearTimeout(timeoutId);
    } catch (err: any) {
      setAiError("AI is taking some time to analyze your artwork. If nothing happens in 2 minutes, click 'Generate AI Description' again. Failing that, you will need to enter your own description.");
      toast({ title: "AI analysis failed", description: err.message, variant: "destructive" });
      clearTimeout(timeoutId);
    } finally {
      setAiLoading(false);
    }
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setArtist({ ...artist, country: e.target.value });
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setArtwork({ ...artwork, currency: e.target.value });
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError("");
    if (!inviteToken || !inviteEmail) {
      setInviteError("Please enter both your email and invitation token.");
      return;
    }
    
    try {
      // SECURITY: Enhanced verification with email validation to prevent token hijacking
      const response = await fetch('/api/verify-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          token: inviteToken,
          email: inviteEmail.trim().toLowerCase()
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.valid) {
        setInviteError(result.details || result.error || "Invalid invitation token or email. Please check your credentials and try again.");
        return;
      }

      // SECURITY: Verify the returned email matches what user entered
      if (result.email !== inviteEmail.trim().toLowerCase()) {
        setInviteError("Email verification failed. Please ensure you're using the correct email address.");
        return;
      }

      // Token and email are valid, proceed with registration
      setIsInviteVerified(true);
      
      // SECURITY: Store validated data in session storage temporarily (cleared on page refresh)
      sessionStorage.setItem('verified_invite_token', inviteToken);
      sessionStorage.setItem('verified_invite_email', result.email);
    } catch (error) {
      setInviteError("Failed to verify invitation credentials. Please try again.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTagWarning("");
    const newErrors: { [key: string]: string } = {};
    if (!artist.username) newErrors.username = 'This field is required.';
    if (!artist.password) newErrors.password = 'This field is required.';
    if (artist.password !== artist.confirmPassword) newErrors.confirmPassword = 'Passwords do not match.';
    if (!artist.firstname) newErrors.firstname = 'This field is required.';
    if (!artist.surname) newErrors.surname = 'This field is required.';
    if (!inviteEmail) newErrors.email = 'We need your email to contact you about your account and if a collector has a query about your artwork.';
    if (!artist.country) newErrors.country = 'This field is required.';
    if (!artist.biog) newErrors.biog = 'This field is required.';
    if (!artist.website) newErrors.website = 'This field is required.';
    if (!artwork.title) newErrors.title = 'This field is required.';
    if (!artwork.year) newErrors.year = 'This field is required.';
    if (!artwork.medium) newErrors.medium = 'This field is required.';
    if (!artwork.dimensions) newErrors.dimensions = 'This field is required.';
    if (!imageUrl) newErrors.image = 'Without a picture of your artwork, we cannot suggest it to collectors.';
    if (!artwork.price) newErrors.price = 'This field is required.';
    if (!artwork.currency) newErrors.currency = 'This field is required.';
    if (!artwork.url) newErrors.url = 'We need a link to your artwork on your website so that we can redirect interested collectors to it.';
    if (!(artwork.description || aiDescription)) newErrors.description = 'This field is required.';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    setIsSubmitting(true);

    try {
      // 1. Create Supabase auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: inviteEmail,
        password: artist.password,
        options: {
          data: {
            username: artist.username,
            role: 'artist'
          }
        }
      });
      if (authError) {
        toast({ title: "Auth failed", description: authError.message, variant: "destructive" });
        setIsSubmitting(false);
        return;
      }
      const userId = authData.user?.id;
      if (!userId) {
        toast({ title: "Auth failed", description: "No user ID returned from Auth.", variant: "destructive" });
        setIsSubmitting(false);
        return;
      }

      // 2. Ensure profile-pictures bucket exists
      try {
        await fetch('/api/storage/create-profile-bucket', { method: 'POST' });
      } catch (error) {
        console.warn('Could not create profile-pictures bucket:', error);
      }

      let profilePictureUrl = null;

      // Upload profile picture if provided
      if (profileImage) {
        try {
          const { url } = await uploadProfilePicture(supabase, userId, profileImage.file, 'artist');
          profilePictureUrl = url;
        } catch (error) {
          console.error('Profile picture upload failed:', error);
          toast({
            title: "Profile picture upload failed",
            description: "Your account was created but the profile picture couldn't be uploaded. You can add it later in your profile.",
            variant: "destructive",
          });
        }
      }

      // 3. Insert into Artists table
      const { error: artistError } = await supabase.from("Artists").insert({
          id: userId,
          username: artist.username,
          firstname: artist.firstname,
          surname: artist.surname,
          email: inviteEmail,
          country: artist.country,
          biog: artist.biog,
          website: artist.website,
          profilepix: profilePictureUrl
        });
      if (artistError) throw artistError;

      // 3. Use the securely uploaded artwork image URL
      if (!imageUrl) throw new Error("No artwork image uploaded.");
      const publicUrl = imageUrl; // Already uploaded securely

      let cleanDescription = (artwork.description || aiDescription).replace(/\*\*Tags:\*\*[\s\S]*/, '').trim();

      // 4. Insert into Artwork table
      const { error: artworkInsertError } = await supabase.from("Artwork").insert({
        artwork_title: artwork.title,
        artist: artist.username,
        artist_id: userId,
        year: artwork.year,
        medium: artwork.medium,
        dimensions: artwork.dimensions,
        description: cleanDescription,
        price: artwork.price,
        currency: artwork.currency,
        artwork_link: artwork.url,
        artwork_image: publicUrl,
        tags: artwork.tags,
        genre: artwork.genre || null,
        style: artwork.style || null,
        subject: artwork.subject || null,
        colour: artwork.colour || null
      });
      if (artworkInsertError) throw artworkInsertError;
      
      // 5. Create Collectors record for the artist (reuse same profile picture)
      const { error: collectorInsertError } = await supabase.from("Collectors").insert({
          id: userId,
          email: inviteEmail,
          role: "artist",
          username: artist.username,
          first_name: artist.firstname,
          surname: artist.surname,
          country: artist.country,
          profilepix: profilePictureUrl,
          preferences: {
              artists: {}, genres: {}, styles: {}, subjects: {},
              colors: {}, priceRanges: {}, interactionCount: 0, viewed_artworks: [],
          },
          is_temporary: false,
      });
      if (collectorInsertError) {
          console.error('Failed to create collector profile for artist:', collectorInsertError.message);
          toast({
              title: "Artist registration successful with a warning",
              description: "Could not create a corresponding collector profile.",
              variant: "default",
          });
      }

      // 6. Mark invitation as used
      if (inviteToken) {
        const { error: updateError } = await supabase
          .from("Invitations")
          .update({ used: true })
          .eq("token", inviteToken);
        if (updateError) console.error("Failed to mark invitation as used:", updateError.message);
      }

      // 7. Send Emails
      const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!;
      const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!;
      
      // -- Email to Admin --
      try {
        const adminTemplateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!;
        await sendEmailJS(serviceId, adminTemplateId, {
          to_email: 'TheKurator@blockmeister.com',
          artist_name: artist.username,
          artist_id: userId,
        }, publicKey);
      } catch (err) { console.error("Failed to send admin notification email:", err); }

      // -- Welcome Email to Artist (using centralized system) --
      try {
        await fetch('/api/send-welcome-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: inviteEmail,
            name: artist.username,
            userType: 'artist',
            firstName: artist.firstname,
            surname: artist.surname
          }),
        });
        console.log('Welcome email sent successfully to artist');
      } catch (emailError) {
        console.error('Failed to send welcome email to artist:', emailError);
        // Don't block registration if email fails
      }

      setSubmissionSuccess(true);
      toast({ title: "Success!", description: "Your artist profile and artwork have been submitted." });

    } catch (err: any) {
      toast({ title: "Submission failed", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler for submitting another artwork
  const handleSubmitAnother = () => {
    setArtwork({
      title: "",
      year: "",
      image: null,
      description: "",
      price: "",
      currency: "USD",
      url: "",
      tags: [],
      medium: "",
      dimensions: "",
      genre: "",
      style: "",
      subject: "",
      colour: "",
    });
    setAIDescription("");
    setImageUrl("");
    setSubmissionSuccess(false);
  };

  // Handler for finishing submission
  const handleFinish = () => {
    router.push("/");
  };

  useEffect(() => {
    if (imageUrl) {
      console.log("Image URL set:", imageUrl);
      // Toast message is already shown in handleArtworkChange
    }
  }, [imageUrl]);

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 flex flex-col items-center py-10 px-4 md:px-10 bg-background">
        {!isInviteVerified ? (
          <div className="w-full max-w-md">
            <h1 className="text-3xl font-bold text-center mb-8">Artist Registration</h1>
            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold mb-3">Verify Your Invitation</h2>
                <p className="text-gray-600 mb-4">
                  Please enter your email and the invitation token we sent you to begin registration.
                </p>
              </div>
              <form onSubmit={handleInviteSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    placeholder="Enter your email address"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Invitation Token
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter your invitation token"
                    value={inviteToken}
                    onChange={(e) => setInviteToken(e.target.value)}
                    required
                    className="w-full"
                  />
                </div>
                {inviteError && (
                  <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded p-3">
                    {inviteError}
                  </div>
                )}
                <Button type="submit" className="w-full">
                  Verify Invitation
                </Button>
              </form>
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
                <h3 className="font-semibold text-blue-800 mb-2">Need Help?</h3>
                <div className="text-blue-700 text-sm space-y-2">
                  <p>
                    <strong>Don't have a token?</strong> Artist registration requires an invitation from our team. 
                    Submit your portfolio on the "For Artists" page to be considered.
                  </p>
                  <p>
                    <strong>Lost your token?</strong> Check your email (including spam folder) for the invitation message, 
                    or contact us for assistance.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : submissionSuccess ? (
          <div className="bg-white p-8 rounded shadow text-center">
            <h2 className="text-2xl font-bold mb-4">Submission Received!</h2>
            <p className="mb-6">Would you like to submit another artwork?</p>
            <div className="flex justify-center gap-6">
              <Button onClick={handleSubmitAnother}>Yes</Button>
              <Button onClick={handleFinish}>No</Button>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-2xl">
            <h1 className="text-3xl font-bold text-center mb-8">Register as an Artist</h1>
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded">
              <p className="text-green-700 text-sm">
                ✓ Invitation verified for: <strong>{inviteEmail}</strong>
              </p>
            </div>
            <form className="space-y-8" onSubmit={handleSubmit}>
              <div>
                <h2 className="text-xl font-bold mb-4">About You</h2>
              
              <div className="flex justify-center mb-6">
                <ProfilePictureUpload 
                  onImageSelect={setProfileImage}
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Username</label>
                  <Input name="username" placeholder="Choose a username" value={artist.username} onChange={handleArtistChange} required />
                  {errors.username && <div className="text-red-600 text-xs mt-1">{errors.username}</div>}
                </div>
                
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <Input name="password" type="password" placeholder="Create a secure password" value={artist.password} onChange={handleArtistChange} required />
                  {errors.password && <div className="text-red-600 text-xs mt-1">{errors.password}</div>}
                </div>
                
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                  <Input name="confirmPassword" type="password" placeholder="Repeat your password" value={artist.confirmPassword} onChange={handleArtistChange} required />
                  {errors.confirmPassword && <div className="text-red-600 text-xs mt-1">{errors.confirmPassword}</div>}
                </div>
                
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">First Name</label>
                  <Input name="firstname" placeholder="Enter your first name" value={artist.firstname} onChange={handleArtistChange} required />
                  {errors.firstname && <div className="text-red-600 text-xs mt-1">{errors.firstname}</div>}
                </div>
                
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Surname</label>
                  <Input name="surname" placeholder="Enter your surname" value={artist.surname} onChange={handleArtistChange} required />
                  {errors.surname && <div className="text-red-600 text-xs mt-1">{errors.surname}</div>}
                </div>
                
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Email Address</label>
                  <Input name="email" type="email" placeholder="Email" value={inviteEmail} readOnly className="bg-gray-50" />
                  {errors.email && <div className="text-red-600 text-xs mt-1">{errors.email}</div>}
                </div>
                
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Country of Residence</label>
                  <select name="country" value={artist.country} onChange={handleCountryChange} className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                    <option value="">Select your country</option>
                    {countries.map((c: { value: string; label: string }) => <option key={c.value} value={c.label}>{c.label}</option>)}
                  </select>
                  {errors.country && <div className="text-red-600 text-xs mt-1">{errors.country}</div>}
                </div>
              </div>
              
              <div className="mt-6 space-y-1">
                <label className="block text-sm font-medium text-gray-700">Artist Biography</label>
                <Textarea name="biog" placeholder="Describe yourself as an artist - your style, influences, and artistic journey" value={artist.biog} onChange={handleArtistChange} required />
                {errors.biog && <div className="text-red-600 text-xs mt-1">{errors.biog}</div>}
              </div>
              
              <div className="mt-6 space-y-1">
                <label className="block text-sm font-medium text-gray-700">Website or Social Media</label>
                <Input name="website" placeholder="https://yourwebsite.com or social media profile" value={artist.website} onChange={handleArtistChange} required />
                {errors.website && <div className="text-red-600 text-xs mt-1">{errors.website}</div>}
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold mb-4">About Your Artwork</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Title of Artwork</label>
                  <Input name="title" placeholder="Enter artwork title" value={artwork.title} onChange={handleArtworkChange} required />
                  {errors.title && <div className="text-red-600 text-xs mt-1">{errors.title}</div>}
                </div>
                
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Year Created</label>
                  <Input name="year" placeholder="e.g. 2024" value={artwork.year} onChange={handleArtworkChange} required />
                  {errors.year && <div className="text-red-600 text-xs mt-1">{errors.year}</div>}
                </div>
                
                <div className="space-y-1">
                  <label htmlFor="medium" className="block text-sm font-medium text-gray-700">Artwork Type</label>
                  <select
                    id="medium"
                    name="medium"
                    value={artwork.medium}
                    onChange={handleArtworkChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Artwork Type</option>
                    {artworkTypeOptions.map(group => [
                      <optgroup key={group.label} label={group.label} />,
                      group.options.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))
                    ])}
                  </select>
                  {errors.medium && <div className="text-red-600 text-xs mt-1">{errors.medium}</div>}
                </div>
                
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Dimensions</label>
                  <Input name="dimensions" placeholder="e.g. 40x60cm" value={artwork.dimensions} onChange={handleArtworkChange} required />
                  {errors.dimensions && <div className="text-red-600 text-xs mt-1">{errors.dimensions}</div>}
                </div>
                
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Price</label>
                  <div className="flex gap-2">
                    <Input name="price" placeholder="Enter price" value={artwork.price} onChange={handleArtworkChange} required className="flex-1" />
                    <select name="currency" value={artwork.currency} onChange={handleCurrencyChange} className="border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[100px]" required>
                      {currencyOptions.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  {errors.price && <div className="text-red-600 text-xs mt-1">{errors.price}</div>}
                  {errors.currency && <div className="text-red-600 text-xs mt-1">{errors.currency}</div>}
                </div>
                
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Artwork URL on your website</label>
                  <Input name="url" placeholder="https://yourwebsite.com/artwork" value={artwork.url} onChange={handleArtworkChange} />
                  {errors.url && <div className="text-red-600 text-xs mt-1">{errors.url}</div>}
                </div>
              </div>
              
              {/* Artwork Upload Section - Full Width */}
              <div className="mt-6 space-y-2">
                <label className="block text-sm font-medium text-gray-700">Upload a picture of your artwork</label>
                <div className="flex justify-start">
                  <div className="w-full max-w-md">
                    <SecureArtworkUpload
                      artworkTitle={artwork.title}
                      onArtworkSelect={handleSecureArtworkUpload}
                      currentImageUrl={imageUrl}
                      maxFileSize={20}
                      enableAdvancedSecurity={true}
                      tempUpload={true}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
                {errors.image && <div className="text-red-600 text-xs mt-1">{errors.image}</div>}
              </div>
              <div className="mt-6 space-y-2">
                <label className="block text-sm font-medium text-gray-700">Artwork Description</label>
                <Textarea 
                  name="description" 
                  placeholder="Describe your artwork - the concept, technique, inspiration, and meaning behind the piece" 
                  value={artwork.description || aiDescription} 
                  onChange={handleArtworkChange} 
                  required 
                  className="min-h-[120px]"
                />
                {errors.description && <div className="text-red-600 text-xs mt-1">{errors.description}</div>}
                <div className="flex justify-start">
                  <Button 
                    type="button" 
                    onClick={handleAIDescription} 
                    className="mt-2 px-4 py-2 text-sm" 
                    disabled={aiLoading || !imageUrl}
                  >
                    {aiLoading ? "Generating..." : "Generate AI Description"}
                  </Button>
                </div>
                {artwork.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {artwork.tags.map((tag) => (
                      <span key={tag} className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs">{tag}</span>
                    ))}
                  </div>
                )}
                {(aiTimeout || aiError) && (
                  <div className="text-yellow-700 bg-yellow-100 border border-yellow-300 rounded px-3 py-2 mt-2 text-sm">
                    AI is taking some time to analyze your artwork. If nothing happens in 2 minutes, click "Generate AI Description" again. Failing that, you will need to enter your own description.
                  </div>
                )}
                {tagWarning && (
                  <div className="text-yellow-700 bg-yellow-100 border border-yellow-300 rounded px-3 py-2 mt-2 text-sm">
                    {tagWarning}
                  </div>
                )}
              </div>
            </div>
              <div className="mt-8 pt-6 border-t border-gray-200">
                <Button 
                  type="submit" 
                  className="w-full py-3 text-lg font-medium" 
                  disabled={isSubmitting || !imageUrl || !(artwork.description || aiDescription)}
                >
                  {isSubmitting ? "Submitting Registration..." : "Complete Artist Registration"}
                </Button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
} 