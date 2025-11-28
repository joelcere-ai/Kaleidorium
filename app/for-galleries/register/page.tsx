"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
// @ts-ignore: No type declarations for 'react-select-country-list'
import countryList from 'react-select-country-list';
import { ProfilePictureUpload } from "@/components/profile-picture-upload";
import { uploadProfilePicture, type OptimizedImage } from "@/lib/image-utils";
import { v4 as uuidv4 } from 'uuid';
import { DesktopHeader } from "@/components/desktop-header";
import { NewMobileHeader } from "@/components/new-mobile-header";

const countries: { value: string; label: string }[] = countryList().getData();

function GalleryRegisterContent() {
  const [gallery, setGallery] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    firstname: "",
    surname: "",
    email: "",
    country: "",
    biog: "",
    website: "",
    notificationConsent: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [profileImage, setProfileImage] = useState<OptimizedImage | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteToken, setInviteToken] = useState("");
  const [isInviteVerified, setIsInviteVerified] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Check for URL parameters on component mount
  useEffect(() => {
    const emailParam = searchParams.get('email');
    const tokenParam = searchParams.get('token');
    
    if (emailParam) {
      setInviteEmail(emailParam);
    }
    if (tokenParam) {
      setInviteToken(tokenParam);
    }
  }, [searchParams]);

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
      
      // Pre-fill email in registration form
      setGallery(prev => ({ ...prev, email: result.email }));
      
      toast({
        title: "Invitation verified!",
        description: "Please complete your gallery registration below.",
      });
    } catch (error: any) {
      setInviteError("An error occurred while verifying your invitation. Please try again.");
      console.error('Invitation verification error:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // SECURITY: Require invitation verification before registration
    if (!isInviteVerified) {
      toast({
        title: "Invitation required",
        description: "Please verify your invitation first.",
        variant: "destructive",
      });
      return;
    }

    // SECURITY: Verify stored invitation data matches form data
    const storedToken = sessionStorage.getItem('verified_invite_token');
    const storedEmail = sessionStorage.getItem('verified_invite_email');
    
    if (!storedToken || !storedEmail || storedEmail !== gallery.email.trim().toLowerCase()) {
      toast({
        title: "Invitation verification required",
        description: "Please verify your invitation again.",
        variant: "destructive",
      });
      setIsInviteVerified(false);
      return;
    }

    const newErrors: { [key: string]: string } = {};
    if (!gallery.username) newErrors.username = 'This field is required.';
    if (!gallery.password) newErrors.password = 'This field is required.';
    if (gallery.password !== gallery.confirmPassword) newErrors.confirmPassword = 'Passwords do not match.';
    if (!gallery.firstname) newErrors.firstname = 'This field is required.';
    if (!gallery.surname) newErrors.surname = 'This field is required.';
    if (!gallery.email) newErrors.email = 'This field is required.';
    if (!gallery.country) newErrors.country = 'This field is required.';
    if (!gallery.biog) newErrors.biog = 'This field is required.';
    if (!gallery.website) newErrors.website = 'This field is required.';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    setIsSubmitting(true);

    try {
      // 1. Create Supabase auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: gallery.email,
        password: gallery.password,
        options: {
          data: {
            username: gallery.username,
            role: 'gallery'
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
          const { url } = await uploadProfilePicture(supabase, userId, profileImage.file, 'gallery');
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

      // 3. Insert into Galleries table (new separate table)
      const { data: insertedGallery, error: galleryError } = await supabase
        .from("Galleries")
        .insert({
          id: userId,
          username: gallery.username,
          firstname: gallery.firstname,
          surname: gallery.surname,
          email: gallery.email,
          country: gallery.country,
          biog: gallery.biog,
          website: gallery.website,
          profilepix: profilePictureUrl,
          notification_consent: gallery.notificationConsent,
        })
        .select()
        .single();
      
      if (galleryError) {
        console.error('Galleries table insert error:', galleryError);
        toast({ 
          title: "Registration Error", 
          description: `Failed to create gallery profile: ${galleryError.message}`, 
          variant: "destructive" 
        });
        setIsSubmitting(false);
        return;
      }
      
      // Verify the record was created
      if (!insertedGallery) {
        console.error('Gallery record was not created:', insertedGallery);
        toast({ 
          title: "Registration Error", 
          description: "Gallery profile was not created. Please try again.", 
          variant: "destructive" 
        });
        setIsSubmitting(false);
        return;
      }

      // 4. Create Collectors record for the gallery (reuse same profile picture)
      // Note: Collectors table uses user_id as foreign key, not id
      const { error: collectorInsertError } = await supabase.from("Collectors").insert({
        user_id: userId,
        email: gallery.email,
        role: "gallery",
        username: gallery.username,
        first_name: gallery.firstname,
        surname: gallery.surname,
        country: gallery.country,
        profilepix: profilePictureUrl,
        notification_consent: gallery.notificationConsent,
        preferences: {
          artists: {}, genres: {}, styles: {}, subjects: {},
          colors: {}, priceRanges: {}, interactionCount: 0, viewed_artworks: [], disliked_artworks: [],
        },
        is_temporary: false,
      });
      if (collectorInsertError) {
        console.error('Failed to create collector profile for gallery:', collectorInsertError.message);
        toast({
          title: "Gallery registration successful with a warning",
          description: "Could not create a corresponding collector profile.",
          variant: "default",
        });
      }

      // 5. Mark invitation as used
      const storedTokenForUpdate = sessionStorage.getItem('verified_invite_token');
      if (storedTokenForUpdate) {
        const { error: updateError } = await supabase
          .from("Invitations")
          .update({ used: true })
          .eq("token", storedTokenForUpdate);
        if (updateError) console.error("Failed to mark invitation as used:", updateError.message);
      }

      // 6. Send Welcome Email
      try {
        await fetch('/api/send-welcome-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: gallery.email,
            name: gallery.username,
            userType: 'gallery',
            firstName: gallery.firstname,
            surname: gallery.surname
          }),
        });
        console.log('Welcome email sent successfully to gallery');
      } catch (emailError) {
        console.error('Failed to send welcome email to gallery:', emailError);
      }

      toast({ 
        title: "Success!", 
        description: "Your gallery account has been created. You can now add artists and upload artworks from your dashboard." 
      });

      // Redirect to account page
      setTimeout(() => {
        router.push('/?view=profile&tab=dashboard');
      }, 2000);

    } catch (err: any) {
      toast({ title: "Registration failed", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      {isMobile ? (
        <NewMobileHeader currentPage="for-galleries" setView={(view) => {
          if (view === "discover") {
            router.push("/");
          } else {
            router.push(`/?view=${view}`);
          }
        }} />
      ) : (
        <DesktopHeader currentPage="for-galleries" setView={(view) => {
          if (view === "discover") {
            router.push("/");
          } else {
            router.push(`/?view=${view}`);
          }
        }} />
      )}

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.push('/?view=profile')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Account
          </Button>
        </div>

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-serif font-bold text-black mb-2" style={{fontFamily: 'Times New Roman, serif'}}>
            Register as a Gallery
          </h1>
          <p className="text-sm font-sans text-gray-700" style={{fontFamily: 'Arial, sans-serif'}}>
            {!isInviteVerified 
              ? "Verify your invitation to begin registration."
              : "Complete your gallery registration below."}
          </p>
        </div>

        {!isInviteVerified ? (
          <div className="space-y-6">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-sans font-bold text-black mb-4" style={{fontFamily: 'Arial, sans-serif'}}>
                Verify Your Invitation
              </h2>
              <p className="text-sm font-sans text-gray-700 mb-4" style={{fontFamily: 'Arial, sans-serif'}}>
                Enter the email address and invitation token you received to verify your invitation.
              </p>
              <form onSubmit={handleInviteSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="inviteEmail" className="text-sm font-sans font-medium text-black" style={{fontFamily: 'Arial, sans-serif'}}>
                    Email Address *
                  </label>
                  <Input
                    id="inviteEmail"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="font-sans"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="inviteToken" className="text-sm font-sans font-medium text-black" style={{fontFamily: 'Arial, sans-serif'}}>
                    Invitation Token *
                  </label>
                  <Input
                    id="inviteToken"
                    type="text"
                    value={inviteToken}
                    onChange={(e) => setInviteToken(e.target.value)}
                    placeholder="Enter your invitation token"
                    className="font-sans"
                    required
                  />
                </div>
                {inviteError && (
                  <div className="p-3 bg-red-100 text-red-800 rounded-md text-sm">
                    {inviteError}
                  </div>
                )}
                <Button
                  type="submit"
                  className="w-full bg-black text-white hover:bg-gray-800 font-sans"
                  style={{fontFamily: 'Arial, sans-serif'}}
                >
                  Verify Invitation
                </Button>
              </form>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Picture */}
          <div className="space-y-2">
            <label className="text-sm font-sans font-medium text-black" style={{fontFamily: 'Arial, sans-serif'}}>
              Gallery Logo/Profile Picture (Optional)
            </label>
            <ProfilePictureUpload
              onImageSelect={setProfileImage}
              currentImage={null}
            />
          </div>

          {/* Username */}
          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-sans font-medium text-black" style={{fontFamily: 'Arial, sans-serif'}}>
              Gallery Username *
            </label>
            <Input
              id="username"
              value={gallery.username}
              onChange={(e) => setGallery({ ...gallery, username: e.target.value })}
              placeholder="Enter gallery username"
              className="font-sans"
            />
            {errors.username && <p className="text-sm text-red-600">{errors.username}</p>}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-sans font-medium text-black" style={{fontFamily: 'Arial, sans-serif'}}>
              Email *
            </label>
            <Input
              id="email"
              type="email"
              value={gallery.email}
              onChange={(e) => setGallery({ ...gallery, email: e.target.value })}
              placeholder="Enter your email"
              className="font-sans"
            />
            {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-sans font-medium text-black" style={{fontFamily: 'Arial, sans-serif'}}>
              Password *
            </label>
            <Input
              id="password"
              type="password"
              value={gallery.password}
              onChange={(e) => setGallery({ ...gallery, password: e.target.value })}
              placeholder="Enter password"
              className="font-sans"
            />
            {errors.password && <p className="text-sm text-red-600">{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-sans font-medium text-black" style={{fontFamily: 'Arial, sans-serif'}}>
              Confirm Password *
            </label>
            <Input
              id="confirmPassword"
              type="password"
              value={gallery.confirmPassword}
              onChange={(e) => setGallery({ ...gallery, confirmPassword: e.target.value })}
              placeholder="Confirm password"
              className="font-sans"
            />
            {errors.confirmPassword && <p className="text-sm text-red-600">{errors.confirmPassword}</p>}
          </div>

          {/* First Name */}
          <div className="space-y-2">
            <label htmlFor="firstname" className="text-sm font-sans font-medium text-black" style={{fontFamily: 'Arial, sans-serif'}}>
              Contact First Name *
            </label>
            <Input
              id="firstname"
              value={gallery.firstname}
              onChange={(e) => setGallery({ ...gallery, firstname: e.target.value })}
              placeholder="Enter first name"
              className="font-sans"
            />
            {errors.firstname && <p className="text-sm text-red-600">{errors.firstname}</p>}
          </div>

          {/* Surname */}
          <div className="space-y-2">
            <label htmlFor="surname" className="text-sm font-sans font-medium text-black" style={{fontFamily: 'Arial, sans-serif'}}>
              Contact Surname *
            </label>
            <Input
              id="surname"
              value={gallery.surname}
              onChange={(e) => setGallery({ ...gallery, surname: e.target.value })}
              placeholder="Enter surname"
              className="font-sans"
            />
            {errors.surname && <p className="text-sm text-red-600">{errors.surname}</p>}
          </div>

          {/* Country */}
          <div className="space-y-2">
            <label htmlFor="country" className="text-sm font-sans font-medium text-black" style={{fontFamily: 'Arial, sans-serif'}}>
              Country *
            </label>
            <select
              id="country"
              value={gallery.country}
              onChange={(e) => setGallery({ ...gallery, country: e.target.value })}
              className="w-full px-3 py-2 border rounded-md font-sans"
            >
              <option value="">Select a country</option>
              {countries.map((country) => (
                <option key={country.value} value={country.value}>
                  {country.label}
                </option>
              ))}
            </select>
            {errors.country && <p className="text-sm text-red-600">{errors.country}</p>}
          </div>

          {/* Biography */}
          <div className="space-y-2">
            <label htmlFor="biog" className="text-sm font-sans font-medium text-black" style={{fontFamily: 'Arial, sans-serif'}}>
              Gallery Description *
            </label>
            <Textarea
              id="biog"
              value={gallery.biog}
              onChange={(e) => setGallery({ ...gallery, biog: e.target.value })}
              placeholder="Tell collectors about your gallery..."
              rows={4}
              className="font-sans"
            />
            {errors.biog && <p className="text-sm text-red-600">{errors.biog}</p>}
          </div>

          {/* Website */}
          <div className="space-y-2">
            <label htmlFor="website" className="text-sm font-sans font-medium text-black" style={{fontFamily: 'Arial, sans-serif'}}>
              Gallery Website *
            </label>
            <Input
              id="website"
              type="text"
              value={gallery.website}
              onChange={(e) => setGallery({ ...gallery, website: e.target.value })}
              onBlur={() => {
                const trimmedLink = gallery.website.trim();
                if (!trimmedLink) {
                  return;
                }
                if (!/^https?:\/\//i.test(trimmedLink)) {
                  setGallery({ ...gallery, website: `https://${trimmedLink}` });
                }
              }}
              placeholder="www.yourgallery.com"
              className="font-sans"
            />
            {errors.website && <p className="text-sm text-red-600">{errors.website}</p>}
          </div>

          {/* Notification Consent */}
          <div className="space-y-2">
            <div className="flex items-start space-x-2">
              <input
                type="checkbox"
                id="notificationConsent"
                checked={gallery.notificationConsent}
                onChange={(e) => setGallery({ ...gallery, notificationConsent: e.target.checked })}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="notificationConsent" className="text-sm font-sans text-black leading-relaxed font-normal" style={{fontFamily: 'Arial, sans-serif'}}>
                Tick this box to receive the odd communication from Kaleidorium.
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-black text-white hover:bg-gray-800 font-sans"
            style={{fontFamily: 'Arial, sans-serif'}}
          >
            {isSubmitting ? "Creating Account..." : "Register as Gallery"}
          </Button>
        </form>
        )}
      </div>
      </div>
    </div>
  );
}

export default function GalleryRegisterPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen">Loading...</div>}>
      <GalleryRegisterContent />
    </Suspense>
  );
}
