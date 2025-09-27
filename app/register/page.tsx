"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { ArrowLeft } from "lucide-react"
import { z } from "zod"
import { v4 as uuidv4 } from 'uuid';
// @ts-ignore: No type declarations for 'react-select-country-list'
import countryList from 'react-select-country-list';

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import type { ArtSpendingRange } from "@/lib/supabase-types"
import { ProfilePictureUpload } from "@/components/profile-picture-upload"
import { uploadProfilePicture, type OptimizedImage } from "@/lib/image-utils"
import { UniversalAppHeader } from "@/components/universal-app-header"

const spendingRanges: { value: ArtSpendingRange; label: string }[] = [
  { value: "0-999", label: "$0 - $999" },
  { value: "1000-4999", label: "$1,000 - $4,999" },
  { value: "5000-9999", label: "$5,000 - $9,999" },
  { value: "10000-24999", label: "$10,000 - $24,999" },
  { value: "25000-49999", label: "$25,000 - $49,999" },
  { value: "50000-99999", label: "$50,000 - $99,999" },
  { value: "100000-249999", label: "$100,000 - $249,999" },
  { value: "250000-499999", label: "$250,000 - $499,999" },
  { value: "500000-999999", label: "$500,000 - $999,999" },
  { value: "1000000+", label: "Above $1,000,000" },
]

const registrationSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  confirmPassword: z.string(),
  artSpendingRange: z.enum([
    "0-999",
    "1000-4999",
    "5000-9999",
    "10000-24999",
    "25000-49999",
    "50000-99999",
    "100000-249999",
    "250000-499999",
    "500000-999999",
    "1000000+",
  ] as const),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

const ART_TYPE_SUGGESTIONS = [
  "Painting",
  "OilOnCanvas",
  "AcrylicOnCanvas",
  "WatercolorOnPaper",
  "GouacheOnPaper",
  "Encaustic",
  "Tempera",
  "MixedMediaPainting",
  "SprayPaint",
  "InkPainting",
  "Fresco",
  "Drawing",
  "Graphite",
  "Charcoal",
  "Ink Drawing",
  "ColoredPencil",
  "Chalk",
  "Pastel",
  "Marker",
  "ContéCrayon",
  "Silverpoint",
  "Sculpture",
  "Bronze",
  "Marble",
  "Wood",
  "Clay",
  "Resin",
  "Plaster",
  "MixedMediaSculpture",
  "FoundObject",
  "Steel",
  "Stone",
  "Glass",
  "Photography",
  "DigitalPhotography",
  "FilmPhotography",
  "Cyanotype",
  "Silver Gelatin Print",
  "Inkjet Print",
  "C-Print",
  "Daguerreotype",
  "Photogram",
  "Ambrotype",
  "Digital Art",
  "JPEG",
  "PNG",
  "MP4",
  "MOV",
  "3DRender",
  "Animation",
  "GIF",
  "GenerativeArt",
  "AR",
  "Interactive",
  "Video",
  "Printmaking",
  "Lithograph",
  "Woodcut",
  "Linocut",
  "Etching",
  "Engraving",
  "Screenprint",
  "Monotype",
  "Aquatint",
  "Drypoint",
  "GicléePrint",
  "MixedMedia",
  "Collage",
  "Assemblage",
  "Altered Book",
  "Textiles + Paint",
  "FoundMaterials",
  "Canvas",
  "HybridWork",
  "Recycled Materials",
  "Photomontage",
  "DigitalAnalogBlend",
  "MultimediaInstallation",
  "Installation",
  "SiteSpecificInstallation",
  "LightBasedInstallation",
  "SoundInstallation",
  "InteractiveInstallation",
  "VideoInstallation",
  "EnvironmentalInstallation",
  "Mixed Media Installation",
  "Kinetic Installation",
  "ImmersiveRoom",
  "ProjectionMapping"
];

const ART_STYLE_SUGGESTIONS = [
  "Abstract",
  "AbstractImpressionism",
  "AcademicArt",
  "Aestheticism",
  "AfroFuturism",
  "AmericanImpressionism",
  "AmericanModernism",
  "AmericanRealism",
  "AmericanRenaissance",
  "AmsterdamImpressionism",
  "Anarcho Punk",
  "AntwerpSchool",
  "ArtDeco",
  "ArtBrut",
  "ArtNouveau",
  "ArtePovera",
  "ArtsandCraftsMovement",
  "AshcanSchool",
  "Avant-garde",
  "BarbizonSchool",
  "Baroque",
  "Bauhaus",
  "Biomorphism",
  "BioPunk",
  "Bohemianism",
  "BologneseSchool",
  "BronzeAge",
  "Caravaggisti",
  "CassetteFuturism",
  "Classicism",
  "ClevelandSchool",
  "COBRA",
  "Colorfield",
  "ConceptualArt",
  "Constructivism",
  "ContemporaryArt",
  "Cosplay",
  "CottageCore",
  "Cubism",
  "CyberGoth",
  "Dadaism",
  "DarkAcademia",
  "DemoScene",
  "DeStijl",
  "DerBlaueReiter",
  "Die Brücke",
  "DieselPunk",
  "DutchandFlemishRenaissancePainting",
  "DutchGoldenAge",
  "EarlyChristianArtAndArchitecture",
  "EarlyRenaissance",
  "Expressionism",
  "Fauvism",
  "FlorentinePainting",
  "Fluxus",
  "FolkArt",
  "FrenchRenaissance",
  "Futurism",
  "GeometricAbstraction",
  "GermanExpressionism",
  "GermanRenaissance",
  "GoodDesign",
  "GothicArt",
  "HagueSchool",
  "HarlemRenaissance",
  "Heavy Metal",
  "HeidelbergSchool",
  "HighRenaissance",
  "HipHop",
  "HudsonRiverSchool",
  "HyperRealism",
  "Impressionism",
  "Industrial",
  "InstallationArt",
  "ItalianRenaissance",
  "Japonisme",
  "KineticArt",
  "LandArt",
  "LesNabis",
  "LowBrow",
  "Luminism",
  "MagicalRealism",
  "Manga",
  "Mannerism",
  "MetaphysicalArt",
  "MilaneseSchool",
  "Minimalism",
  "MissionSchool",
  "ModernArt",
  "Modernism",
  "MoMA",
  "NaïveArt",
  "Naturalism",
  "NazareneMovement",
  "NeoImpressionism",
  "NeoRomanticism",
  "Neoclassicism",
  "NeoVictorian",
  "NewObjectivity",
  "Nihonga",
  "NorthernRenaissance",
  "NorwichSchool",
  "NouveauRéalisme",
  "OpArt",
  "OutsiderArt",
  "PaduanSchool",
  "PennsylvaniaImpressionism",
  "PerformanceArt",
  "Photorealism",
  "PopArt",
  "PopSurrealism",
  "PostImpressionism",
  "PostMinimalism",
  "Postmodernism",
  "PreRaphaelite Brotherhood",
  "Precisionism",
  "Primitivism",
  "Public art",
  "Punk",
  "Rave",
  "Rayonism",
  "RayPunk",
  "Realism",
  "Regionalism",
  "Renaissance",
  "Rocker",
  "Rococo",
  "RomanesqueArt",
  "Romanticism",
  "SchoolofFerrara",
  "SchoolofFontainebleau",
  "SchoolofParis",
  "SectiondOr",
  "Shin-hanga",
  "SieneseSchool",
  "Skaters",
  "SocialRealism",
  "SocialistRealism",
  "SōsakuHanga",
  "SpanishEclecticism",
  "SpanishRenaissance",
  "SteamPunk",
  "StreetArt",
  "SturmundDrang",
  "Surf",
  "Suprematism",
  "Surrealism",
  "Symbolism",
  "Synthetism",
  "Tachisme",
  "Tate",
  "Tonalism",
  "Typographic",
  "Ukiyoe",
  "Urban",
  "UtrechtCaravaggism",
  "Vaporwave",
  "VenetianPainting",
  "WashingtonColorSchool",
  "YoungBritishArtists",
  "Zef"
];

const countries: { value: string; label: string }[] = countryList().getData();

export default function RegisterPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [username, setUsername] = useState("")
  const [firstName, setFirstName] = useState("")
  const [surname, setSurname] = useState("")
  const [country, setCountry] = useState("")
  const [artTypes, setArtTypes] = useState<string[]>([])
  const [artStyles, setArtStyles] = useState<string[]>([])
  const [artTypeInput, setArtTypeInput] = useState("")
  const [isMobile, setIsMobile] = useState(false)
  const [artStyleInput, setArtStyleInput] = useState("")
  const [artSpendingRange, setArtSpendingRange] = useState<ArtSpendingRange>("0-999")
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const [artTypeSuggestionIdx, setArtTypeSuggestionIdx] = useState(-1);
  const [artStyleSuggestionIdx, setArtStyleSuggestionIdx] = useState(-1);
  const [profileImage, setProfileImage] = useState<OptimizedImage | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setIsLoading(true)

    try {
      // Validate form data
      const formData = { email, password, confirmPassword, artSpendingRange, username, firstName, surname, country, artTypes, artStyles }
      registrationSchema.parse(formData)

      // Register user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (authError) throw authError

      if (authData.user) {
        // Ensure profile-pictures bucket exists
        try {
          await fetch('/api/storage/create-profile-bucket', { method: 'POST' });
        } catch (error) {
          console.warn('Could not create profile-pictures bucket:', error);
        }

        let profilePictureUrl = null;

        // Upload profile picture if provided
        if (profileImage) {
          try {
            const { url } = await uploadProfilePicture(supabase, authData.user.id, profileImage.file, 'collector');
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

        // Convert temporary collector profile to permanent if it exists
        const { data: tempCollector } = await supabase
          .from("Collectors")
          .select("*")
          .eq("user_id", authData.user.id)
          .eq("is_temporary", true)
          .single()

        if (tempCollector) {
          await supabase
            .from("Collectors")
            .update({ 
              is_temporary: false,
              profilepix: profilePictureUrl 
            })
            .eq("id", tempCollector.id)
        } else {
          // Create new collector profile
          const collectorId = uuidv4();
          const { error: insertError } = await supabase.from("Collectors").insert({
            id: collectorId,
            user_id: authData.user.id,
            username,
            first_name: firstName,
            surname,
            country,
            art_types: artTypes,
            art_styles: artStyles,
            price_range: artSpendingRange,
            email,
            profilepix: profilePictureUrl,
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
            is_temporary: false,
          });
          if (insertError) {
            toast({
              title: "Registration failed",
              description: `Could not save your profile: ${insertError.message}`,
              variant: "destructive",
            });
            setIsLoading(false);
            return;
          }
        }

        // Send welcome email
        try {
          await fetch('/api/send-welcome-email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: email,
              name: `${firstName} ${surname}`,
              userType: 'collector',
              firstName: firstName,
              surname: surname
            }),
          });
          console.log('Welcome email sent successfully');
        } catch (emailError) {
          console.error('Failed to send welcome email:', emailError);
          // Don't block registration if email fails
        }

        toast({
          title: "Registration successful!",
          description: "Welcome to Kaleidorium! Please check your email to verify your account and get started.",
        })

        router.push("/?view=profile")
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: { [key: string]: string } = {}
        error.errors.forEach((err) => {
          if (err.path) {
            newErrors[err.path[0]] = err.message
          }
        })
        setErrors(newErrors)
      } else {
        toast({
          title: "Registration failed",
          description: "An error occurred during registration. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <UniversalAppHeader currentPage="register" />
      <div className="container max-w-[800px] py-10">
        {!isMobile && (
          <Button
            variant="ghost"
            className="mb-8"
            onClick={() => router.push("/?view=discover")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Discovery
          </Button>
        )}

        <div className="grid gap-6">
          <div className="flex flex-col items-center text-center">
            <h1 className="text-base font-serif font-bold text-black mb-2" style={{fontSize: '16px', fontFamily: 'Times New Roman, serif'}}>
              Join Kaleidorium
            </h1>
            <p className="text-sm font-sans text-gray-600 max-w-[600px]" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>
              Create an account to save your preferences, get personalized artwork recommendations,
              and build your digital art collection.
            </p>
          </div>

          <div className="flex justify-center">
            <ProfilePictureUpload 
              onImageSelect={setProfileImage}
              disabled={isLoading}
            />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                required
              />
              <Input
                type="text"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={isLoading}
                required
              />
              <Input
                type="text"
                placeholder="Surname"
                value={surname}
                onChange={(e) => setSurname(e.target.value)}
                disabled={isLoading}
                required
              />
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                disabled={isLoading}
                required
                className="block w-full border border-input rounded-md px-3 py-2 text-sm"
              >
                <option value="">Select Country</option>
                {countries.map((c: { value: string; label: string }) => (
                  <option key={c.value} value={c.label}>{c.label}</option>
                ))}
              </select>
            </div>
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
            />
            {errors.email && (
              <p className="text-sm text-red-500 mt-1">{errors.email}</p>
            )}
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
            />
            {errors.password && (
              <p className="text-sm text-red-500 mt-1">{errors.password}</p>
            )}
            <Input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
              required
            />
            {errors.confirmPassword && (
              <p className="text-sm text-red-500 mt-1">{errors.confirmPassword}</p>
            )}
            <div>
              <label className="block mb-1 text-sm font-sans font-bold text-black" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>What mediums of art do you enjoy the most?</label>
              <div className="flex flex-wrap gap-2 mb-1">
                {artTypes.map((tag, idx) => (
                  <span key={tag+idx} className="bg-blue-100 text-blue-800 px-2 py-1 rounded flex items-center">
                    {tag}
                    <button type="button" className="ml-1 text-xs" onClick={() => setArtTypes(artTypes.filter((t, i) => i !== idx))}>&times;</button>
                  </span>
                ))}
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Start typing..."
                  value={artTypeInput}
                  onChange={e => {
                    setArtTypeInput(e.target.value);
                    setArtTypeSuggestionIdx(-1);
                  }}
                  onKeyDown={e => {
                    const suggestions = ART_TYPE_SUGGESTIONS.filter(s => !artTypes.includes(s) && s.toLowerCase().includes(artTypeInput.toLowerCase()));
                    if (e.key === 'ArrowDown') {
                      setArtTypeSuggestionIdx(idx => Math.min(idx + 1, suggestions.length - 1));
                    } else if (e.key === 'ArrowUp') {
                      setArtTypeSuggestionIdx(idx => Math.max(idx - 1, 0));
                    } else if ((e.key === 'Enter' || e.key === ',') && artTypeInput.trim()) {
                      e.preventDefault();
                      let value = artTypeInput.trim();
                      if (artTypeSuggestionIdx >= 0 && suggestions[artTypeSuggestionIdx]) {
                        value = suggestions[artTypeSuggestionIdx];
                      }
                      if (!artTypes.includes(value)) setArtTypes([...artTypes, value]);
                      setArtTypeInput("");
                      setArtTypeSuggestionIdx(-1);
                    }
                  }}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isLoading}
                  autoComplete="off"
                />
                {artTypeInput && (
                  <ul className="absolute z-10 left-0 right-0 bg-white border border-gray-200 rounded shadow mt-1 max-h-40 overflow-y-auto">
                    {ART_TYPE_SUGGESTIONS.filter(s => !artTypes.includes(s) && s.toLowerCase().includes(artTypeInput.toLowerCase())).map((s, idx) => (
                      <li
                        key={s}
                        className={`px-3 py-2 cursor-pointer ${artTypeSuggestionIdx === idx ? 'bg-blue-100' : ''}`}
                        onMouseDown={() => {
                          if (!artTypes.includes(s)) setArtTypes([...artTypes, s]);
                          setArtTypeInput("");
                          setArtTypeSuggestionIdx(-1);
                        }}
                        onMouseEnter={() => setArtTypeSuggestionIdx(idx)}
                      >
                        {s}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div>
              <label className="block mb-1 text-sm font-sans font-bold text-black" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>What styles of art resonate with you the most?</label>
              <div className="flex flex-wrap gap-2 mb-1">
                {artStyles.map((tag, idx) => (
                  <span key={tag+idx} className="bg-green-100 text-green-800 px-2 py-1 rounded flex items-center">
                    {tag}
                    <button type="button" className="ml-1 text-xs" onClick={() => setArtStyles(artStyles.filter((t, i) => i !== idx))}>&times;</button>
                  </span>
                ))}
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Start typing..."
                  value={artStyleInput}
                  onChange={e => {
                    setArtStyleInput(e.target.value);
                    setArtStyleSuggestionIdx(-1);
                  }}
                  onKeyDown={e => {
                    const suggestions = ART_STYLE_SUGGESTIONS.filter(s => !artStyles.includes(s) && s.toLowerCase().includes(artStyleInput.toLowerCase()));
                    if (e.key === 'ArrowDown') {
                      setArtStyleSuggestionIdx(idx => Math.min(idx + 1, suggestions.length - 1));
                    } else if (e.key === 'ArrowUp') {
                      setArtStyleSuggestionIdx(idx => Math.max(idx - 1, 0));
                    } else if ((e.key === 'Enter' || e.key === ',') && artStyleInput.trim()) {
                      e.preventDefault();
                      let value = artStyleInput.trim();
                      if (artStyleSuggestionIdx >= 0 && suggestions[artStyleSuggestionIdx]) {
                        value = suggestions[artStyleSuggestionIdx];
                      }
                      if (!artStyles.includes(value)) setArtStyles([...artStyles, value]);
                      setArtStyleInput("");
                      setArtStyleSuggestionIdx(-1);
                    }
                  }}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isLoading}
                  autoComplete="off"
                />
                {artStyleInput && (
                  <ul className="absolute z-10 left-0 right-0 bg-white border border-gray-200 rounded shadow mt-1 max-h-40 overflow-y-auto">
                    {ART_STYLE_SUGGESTIONS.filter(s => !artStyles.includes(s) && s.toLowerCase().includes(artStyleInput.toLowerCase())).map((s, idx) => (
                      <li
                        key={s}
                        className={`px-3 py-2 cursor-pointer ${artStyleSuggestionIdx === idx ? 'bg-green-100' : ''}`}
                        onMouseDown={() => {
                          if (!artStyles.includes(s)) setArtStyles([...artStyles, s]);
                          setArtStyleInput("");
                          setArtStyleSuggestionIdx(-1);
                        }}
                        onMouseEnter={() => setArtStyleSuggestionIdx(idx)}
                      >
                        {s}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div>
              <label className="block mb-1 text-sm font-sans font-bold text-black" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>What's your typical budget when buying an artwork?</label>
              <select
                value={artSpendingRange}
                onChange={e => setArtSpendingRange(e.target.value as ArtSpendingRange)}
                disabled={isLoading}
                required
                className="block w-full border border-input rounded-md px-3 py-2 text-sm"
              >
                <option value="">Select price range</option>
                {spendingRanges.map((range) => (
                  <option key={range.value} value={range.value}>{range.label}</option>
                ))}
              </select>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Button
              variant="link"
              className="p-0 h-auto font-normal"
              onClick={() => router.push("/login")}
            >
              Sign in
            </Button>
          </p>
        </div>
      </div>
    </div>
  )
} 