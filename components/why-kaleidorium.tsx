"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ChevronDown, ChevronUp, Facebook, Instagram, MessageCircle, Copy } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const KaleidoriumXIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)

const KALEIDORIUM_SITE_URL = "https://www.kaleidorium.com"
const KALEIDORIUM_SHARE_TEXT =
  "Discover Kaleidorium — a new art discovery engine that connects collectors and artists based on taste."

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = "collector" | "artist" | "gallery"

// ─── How-It-Works data ────────────────────────────────────────────────────────

const HOW_IT_WORKS: Record<Role, { title: string; body: string }[]> = {
  collector: [
    {
      title: "Discover Art That Fits Your Taste",
      body: "Swipe through artworks and tell your Kurator what you love.",
    },
    {
      title: "Your Kurator Learns",
      body: "Each like, dislike and save helps Kaleidorium better understand your aesthetic preferences.",
    },
    {
      title: "Build Your Personal Collection",
      body: "Save artworks you love and shape a collection that reflects your taste over time.",
    },
    {
      title: "Connect with Artists and Galleries",
      body: "When something speaks to you, visit the artist or gallery directly to explore more.",
    },
  ],
  artist: [
    {
      title: "Feature Your Artwork",
      body: "We will create your profile, upload your work and automatically redirect collectors to your own website or portfolio.",
    },
    {
      title: "Get Matched to the Right Collectors",
      body: "Kaleidorium helps surface your art to collectors whose tastes are more likely to align with your style.",
    },
    {
      title: "Track Interest",
      body: "See how your work performs through views, likes, saves and collector engagement.",
    },
    {
      title: "Grow Meaningful Connections",
      body: "Turn discovery into direct interest by connecting collectors to your own site or contact point.",
    },
  ],
  gallery: [
    {
      title: "Showcase Your Artists",
      body: "We will create your gallery profile, create profiles for your artists, upload artwork and automatically redirect collectors to your own website.",
    },
    {
      title: "Reach Better-Fit Collectors",
      body: "Kaleidorium helps put the right works in front of collectors based on aesthetic fit, not just chance.",
    },
    {
      title: "Track Performance",
      body: "See which artists and artworks attract the most attention through engagement signals and activity.",
    },
    {
      title: "Grow Your Collector Base",
      body: "Drive qualified discovery and direct interested collectors to your gallery website or contact channels.",
    },
  ],
}

// ─── Role selector cards ───────────────────────────────────────────────────────

const ROLE_CARDS: {
  role: Role
  label: string
  tagline: string
  colors: { bg: string; border: string; text: string; activeBg: string; activeBorder: string; activeText: string }
}[] = [
  {
    role: "collector",
    label: "Collector",
    tagline: "Discover art tailored to your taste and champion emerging artists.",
    colors: {
      bg: "#F6FBF8", border: "#CFE5D8", text: "#2F6B4F",
      activeBg: "#EDF7F2", activeBorder: "#2F6B4F", activeText: "#1D4D38",
    },
  },
  {
    role: "artist",
    label: "Artist",
    tagline: "Get your work in front of collectors who will truely appreciate it.",
    colors: {
      bg: "#FAFAFA", border: "#D8D8D8", text: "#222222",
      activeBg: "#FFFFFF", activeBorder: "#222222", activeText: "#000000",
    },
  },
  {
    role: "gallery",
    label: "Gallery",
    tagline: "Grow your collector base effortlessly.",
    colors: {
      bg: "#FDF4F4", border: "#E6CACA", text: "#9B4B4B",
      activeBg: "#F8ECEC", activeBorder: "#9B4B4B", activeText: "#7A2E2E",
    },
  },
]

// ─── Artwork grid (reused hero visual) ────────────────────────────────────────

function ArtworkGrid() {
  const images = [
    { src: "/Onboarding-images/For Collectors/Hennie_3__The_Visitor___120x100cm__Oil__1754903123908.jpg", alt: "The Visitor" },
    { src: "/Onboarding-images/For Collectors/Josignacio_4_Josignacio_s_Rhapsody_Blue_1754903114939.jpg", alt: "Rhapsody Blue" },
    { src: "/Onboarding-images/For Collectors/Peterson_5_Isometric_Pixel_Art_by_Peterso_1754903119020.gif", alt: "Isometric Pixel Art" },
    { src: "/Onboarding-images/For Collectors/Steampunk3_1755249065054.png", alt: "Steampunk" },
    { src: "/Onboarding-images/For Collectors/Theo_3_677_To_Theo_van_Gogh__Arles__S_1754903144275.jpg", alt: "To Theo" },
    { src: "/Onboarding-images/For Collectors/xcopy_2_XCOPY_LAST_SELFIE_4K.gif", alt: "Last Selfie" },
  ]
  return (
    <div className="flex flex-col items-center">
      <div className="grid grid-cols-6 gap-1.5 max-w-lg mx-auto">
        {images.map((img) => (
          <div key={img.src} className="w-16 h-16 bg-white rounded-md overflow-hidden shadow-sm border border-gray-100">
            <img src={img.src} alt={img.alt} className="w-full h-full object-cover" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Invite an artist (site share) ───────────────────────────────────────────

function InviteArtistShare() {
  const { toast } = useToast()
  const shareUrl = KALEIDORIUM_SITE_URL

  const handleCopy = async () => {
    const text = `${KALEIDORIUM_SHARE_TEXT}\n\n${shareUrl}`
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Link copied!",
        description: "Paste it in a message to an artist you admire.",
      })
    } catch {
      toast({
        title: "Could not copy",
        description: "Please copy the link manually.",
        variant: "destructive",
      })
    }
  }

  return (
    <div
      className="bg-[#FAFAF8] rounded-2xl border border-[#E6E4DF] p-6"
      style={{ boxShadow: "0 1px 4px rgba(20,20,20,0.04)" }}
    >
      <h3
        style={{
          fontSize: "18px",
          fontWeight: 700,
          color: "#1E1E1C",
          textAlign: "center",
          marginBottom: "8px",
        }}
      >
        Invite an artist you admire
      </h3>
      <p
        style={{
          fontSize: "14px",
          lineHeight: 1.55,
          color: "#5F5F5A",
          textAlign: "center",
          maxWidth: "420px",
          margin: "0 auto 20px",
        }}
      >
        {KALEIDORIUM_SHARE_TEXT}
      </p>
      <p className="artwork-meta text-center mb-3">Share Kaleidorium</p>
      <div className="flex justify-center gap-2 flex-wrap">
        <button
          className="share-icon-btn"
          title="Share on X"
          type="button"
          onClick={() =>
            window.open(
              `https://twitter.com/intent/tweet?text=${encodeURIComponent(KALEIDORIUM_SHARE_TEXT)}&url=${encodeURIComponent(shareUrl)}`,
              "_blank",
              "noopener,noreferrer"
            )
          }
        >
          <KaleidoriumXIcon className="w-[13px] h-[13px]" />
        </button>
        <button
          className="share-icon-btn"
          title="Share on Facebook"
          type="button"
          onClick={() =>
            window.open(
              `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(KALEIDORIUM_SHARE_TEXT)}`,
              "_blank",
              "noopener,noreferrer"
            )
          }
        >
          <Facebook />
        </button>
        <button
          className="share-icon-btn"
          title="Share on Instagram (copy link)"
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(`${KALEIDORIUM_SHARE_TEXT}\n\n${shareUrl}`)
              toast({
                title: "Link copied!",
                description: "Paste it in your Instagram story or post.",
              })
            } catch {
              handleCopy()
            }
          }}
        >
          <Instagram />
        </button>
        <button
          className="share-icon-btn"
          title="Share on WhatsApp"
          type="button"
          onClick={() => {
            const whatsappText = `${KALEIDORIUM_SHARE_TEXT}\n\n${shareUrl}`
            window.open(
              `https://wa.me/?text=${encodeURIComponent(whatsappText)}`,
              "_blank",
              "noopener,noreferrer"
            )
          }}
        >
          <MessageCircle />
        </button>
        <button className="share-icon-btn" title="Copy link" type="button" onClick={handleCopy}>
          <Copy />
        </button>
      </div>
    </div>
  )
}

// ─── Artist portfolio form (existing — unchanged) ──────────────────────────────

function ForArtistsForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    portfolioLink: "",
    artworkDetails: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus(null)
    try {
      const response = await fetch("/api/artist-submission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      if (response.ok) {
        setSubmitStatus("Thank you! Your portfolio has been submitted for review. We'll be in touch soon.")
        setFormData({ name: "", email: "", portfolioLink: "", artworkDetails: "" })
      } else {
        setSubmitStatus("There was an error submitting your portfolio. Please try again.")
      }
    } catch {
      setSubmitStatus("There was an error submitting your portfolio. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.value })

  const handlePortfolioBlur = () => {
    setFormData((prev) => {
      const t = prev.portfolioLink.trim()
      if (!t || /^https?:\/\//i.test(t)) return prev
      return { ...prev, portfolioLink: `https://${t}` }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-800 mb-1">Artist Name</label>
        <input type="text" name="name" value={formData.name} onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black text-sm"
          placeholder="Your artist name" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-800 mb-1">Email</label>
        <input type="email" name="email" value={formData.email} onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black text-sm"
          placeholder="your@email.com" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-800 mb-1">Portfolio / Website / Instagram Link</label>
        <input type="text" name="portfolioLink" value={formData.portfolioLink}
          onChange={handleChange} onBlur={handlePortfolioBlur}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black text-sm"
          placeholder="Link to your portfolio, website or Instagram" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-800 mb-1">Artwork Details</label>
        <textarea name="artworkDetails" value={formData.artworkDetails} onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black text-sm resize-y min-h-[144px]"
          placeholder={"Please list each artwork you'd like registered, with: title, dimensions, price, and year created. E.g. — 'Sunset Over Nairobi, 60×80cm, $1200, 2023'"}
          rows={6} required />
      </div>
      <Button type="submit" disabled={isSubmitting} variant="outline" className="w-full">
        {isSubmitting ? "Submitting…" : "Submit Portfolio"}
      </Button>
      <p className="text-xs text-gray-500 leading-relaxed">
        We'll review your submission, create your account, upload your chosen artwork for you and reach out by email with your account details or any questions. You will be able to change all this information at your convenience once your account is created.
      </p>
      {submitStatus && (
        <div className={`p-3 rounded-md text-sm ${submitStatus.startsWith("Thank") ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
          {submitStatus}
        </div>
      )}
    </form>
  )
}

// ─── Gallery application form (existing — unchanged) ─────────────────────────

function ForGalleriesForm() {
  const [formData, setFormData] = useState({ name: "", website: "", contactName: "", email: "", message: "" })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus(null)
    let websiteUrl = formData.website.trim()
    if (websiteUrl && !/^https?:\/\//i.test(websiteUrl)) websiteUrl = `https://${websiteUrl}`
    try {
      const response = await fetch("/api/artist-submission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "gallery", name: formData.name, website: websiteUrl, email: formData.email, contactName: formData.contactName, message: formData.message }),
      })
      if (response.ok) {
        setSubmitStatus("Thank you! Your gallery has been submitted for review. We'll be in touch soon.")
        setFormData({ name: "", website: "", contactName: "", email: "", message: "" })
      } else {
        setSubmitStatus("There was an error submitting your gallery. Please try again.")
      }
    } catch {
      setSubmitStatus("There was an error submitting your gallery. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleWebsiteBlur = () => {
    setFormData((prev) => {
      const t = prev.website.trim()
      if (!t || /^https?:\/\//i.test(t)) return prev
      return { ...prev, website: `https://${t}` }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-800 mb-1">Gallery Name</label>
        <input type="text" name="name" value={formData.name} onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black text-sm"
          placeholder="Your gallery name" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-800 mb-1">Gallery Website</label>
        <input type="url" name="website" value={formData.website} onChange={handleChange} onBlur={handleWebsiteBlur}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black text-sm"
          placeholder="www.yourgallery.com" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-800 mb-1">Contact Name</label>
        <input type="text" name="contactName" value={formData.contactName} onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black text-sm"
          placeholder="Your name" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-800 mb-1">Email</label>
        <input type="email" name="email" value={formData.email} onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black text-sm"
          placeholder="your@email.com" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-800 mb-1">Tell us which artists and artwork you would like to list</label>
        <textarea name="message" value={formData.message} onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black text-sm resize-y min-h-[144px]"
          placeholder={"Please list each artist with corresponding artwork you'd like registered, with: title, dimensions, price, and year created. E.g. — 'John Corletto, Sunset Over Nairobi, 60×80cm, $1200, 2023'. Ensure that the artist's work is easily searchable on the link you have provided."}
          rows={6} required />
      </div>
      <Button type="submit" disabled={isSubmitting} variant="outline" className="w-full">
        {isSubmitting ? "Submitting…" : "Submit for Review"}
      </Button>
      <p className="text-xs text-gray-500 leading-relaxed">
        We will only use this information to review your application and notify you. Unused submissions are deleted within one week.
      </p>
      {submitStatus && (
        <div className={`p-3 rounded-md text-sm ${submitStatus.startsWith("Thank") ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
          {submitStatus}
        </div>
      )}
    </form>
  )
}

// ─── FAQ data ─────────────────────────────────────────────────────────────────

const FAQ_ITEMS = [
  { id: "what", q: "What is Kaleidorium?", a: "Kaleidorium is a personalised art discovery app that connects collectors, artists and galleries through taste-led discovery." },
  { id: "marketplace", q: "Are you a marketplace or a gallery?", a: "No. Kaleidorium is not a marketplace nor a gallery. We do not facilitate any transaction. We connect artists and collectors. We're not part of any conversation or transaction that follows." },
  { id: "howshown", q: "How will my artwork be shown to collectors?", a: "Your work is not displayed side-by-side in a crowded feed. Instead, it's shown individually to collectors whose preferences suggest they'll genuinely appreciate it. We use a personalised matching approach, more like a curator than a catalogue." },
  { id: "interested", q: "What happens when collectors are interested?", a: "Each artwork links directly to your own website, online store, or gallery page. Kaleidorium does not handle transactions. We simply bring qualified, interested collectors to you. If you're represented by a gallery, you can set your redirect link to point there instead." },
  { id: "free-collector", q: "Is Kaleidorium free for collectors?", a: "Yes. Collectors can discover, save and explore artworks for free." },
  { id: "taste", q: "How does Kaleidorium learn my taste?", a: "Your Kurator gets smarter as you like, dislike and explore artworks over time." },
  { id: "artist-join", q: "Do artists join immediately?", a: "We will review the artwork you submitted for listing. If there are any issues with your submission we will contact you on the email provided." },
  { id: "not-selected", q: "What if I'm not selected?", a: "We're curating a high-quality experience for both artists and collectors. If you're not selected initially, you can always reapply with updated work." },
  { id: "why-artist", q: "Why should I join as an artist?", a: "Kaleidorium helps get your art in front of collectors who are more likely to appreciate it." },
  { id: "gallery-join", q: "Do galleries join immediately?", a: "We will review the artists and artwork you submitted for listing. If there are any issues with your submission we will contact you on the email provided." },
  { id: "gallery-multi", q: "Can galleries showcase multiple artists?", a: "Yes. Galleries can present multiple artists and artworks through one profile." },
  { id: "why-gallery", q: "Why should I join as a gallery?", a: "Kaleidorium helps grow your collector base by putting the right works in front of the right audience." },
  { id: "free", q: "Is Kaleidorium free?", a: "Yes. Kaleidorium is completely free for artists and galleries." },
  { id: "commissions", q: "Do you charge commissions?", a: "No. We do not take commissions on sales. Collectors are directed to your website or preferred contact method." },
  { id: "future-charges", q: "Will there be charges in the future?", a: "Possibly. We expect to introduce optional subscription plans in the future as the platform grows. Existing members will be informed well in advance." },
  { id: "auto-charge", q: "Will I be charged automatically?", a: "No. You will never be charged without your explicit agreement." },
  { id: "why-created", q: "Why did you create Kaleidorium?", a: "We've seen too many brilliant artists struggle to get noticed. In a world overflowing with content, being good is no longer enough — you also need to be found. Kaleidorium helps solve this by curating artwork to match each collector's taste, increasing the chance of discovery and appreciation." },
]

function UnifiedFAQ() {
  const [open, setOpen] = useState<string | null>(null)
  return (
    <div className="space-y-2">
      {FAQ_ITEMS.map((item) => (
        <div key={item.id} className="bg-white border border-[#E6E4DF] rounded-xl overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[#FAFAF8] transition-colors"
            style={{ fontSize: '16px', fontWeight: 600, color: '#1E1E1C' }}
            onClick={() => setOpen(open === item.id ? null : item.id)}
          >
            <span>{item.q}</span>
            {open === item.id ? <ChevronUp className="h-4 w-4 flex-shrink-0 text-[#8A8A84]" /> : <ChevronDown className="h-4 w-4 flex-shrink-0 text-[#8A8A84]" />}
          </button>
          {open === item.id && (
            <div className="faq-answer px-5 pb-4 pt-3 border-t border-[#E6E4DF]">
              {item.a}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

interface WhyKaleidoriumProps {
  initialRole?: Role | null
  onRoleChange?: (role: Role) => void
}

export function WhyKaleidoriumPage({ initialRole, onRoleChange }: WhyKaleidoriumProps) {
  const router = useRouter()
  const formRef = useRef<HTMLDivElement>(null)
  const howItWorksRef = useRef<HTMLDivElement>(null)
  const [selectedRole, setSelectedRole] = useState<Role | null>(initialRole ?? null)
  const [showInvitePanel, setShowInvitePanel] = useState(false)
  const [artistSignupMode, setArtistSignupMode] = useState<"assisted" | null>(null)
  const [gallerySignupMode, setGallerySignupMode] = useState<"assisted" | null>(null)
  const inviteRef = useRef<HTMLDivElement>(null)
  const artistFormRef = useRef<HTMLDivElement>(null)
  const galleryFormRef = useRef<HTMLDivElement>(null)

  // Sync role from URL query param on mount
  const searchParams = useSearchParams()
  useEffect(() => {
    const roleParam = searchParams.get("role") as Role | null
    if (roleParam && ["collector", "artist", "gallery"].includes(roleParam)) {
      setSelectedRole(roleParam)
      // Scroll to How It Works when arriving via a direct role URL
      setTimeout(() => {
        howItWorksRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      }, 150)
    }
  }, [searchParams])

  const handleRoleSelect = (role: Role) => {
    setShowInvitePanel(false)
    setArtistSignupMode(null)
    setGallerySignupMode(null)
    setSelectedRole(role)
    onRoleChange?.(role)
    const url = new URL(window.location.href)
    url.searchParams.set("role", role)
    window.history.replaceState(null, "", url.toString())
    setTimeout(() => {
      howItWorksRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 80)
  }

  const handleInviteSelect = () => {
    setSelectedRole(null)
    setArtistSignupMode(null)
    setGallerySignupMode(null)
    setShowInvitePanel(true)
    const url = new URL(window.location.href)
    url.searchParams.delete("role")
    window.history.replaceState(null, "", url.toString())
    setTimeout(() => {
      inviteRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 80)
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#FAFAF8]">

      {/* ── 1. Hero ──────────────────────────────────────────────── */}
      {/* top: 48px desktop / 32px mobile — hero→next: 48px */}
      <div className="bg-[#FAFAF8]" style={{ paddingTop: 'clamp(32px, 5vw, 48px)', paddingBottom: '48px' }}>
        <div className="container mx-auto px-4 max-w-2xl text-center">
          {/* Title — inline style guarantees 26px regardless of cascade */}
          <p style={{ fontSize: '26px', fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.02em', color: '#1E1E1C', textAlign: 'center', marginBottom: '16px' }}>
            Art, Matched to Taste
          </p>
          {/* Intro — 16px */}
          <p style={{ fontSize: '16px', fontWeight: 400, lineHeight: 1.6, color: '#5F5F5A', maxWidth: '520px', margin: '0 auto 24px', textAlign: 'center' }}>
            Whether you collect, create or represent art, Kaleidorium helps the right works find the right audience.
          </p>
          {/* Artwork grid */}
          <ArtworkGrid />
        </div>
      </div>

      {/* ── 2. Role selector ─────────────────────────────────────── */}
      <div className="bg-white border-b border-[#E6E4DF]" style={{ paddingTop: '32px', paddingBottom: '32px' }}>
        <div className="container mx-auto px-4 max-w-4xl">
          <p style={{ fontSize: '20px', fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.01em', color: '#1E1E1C', textAlign: 'center', marginBottom: '24px' }}>
            Explore how it works
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {ROLE_CARDS.map(({ role, label, tagline, colors }) => {
              const active = selectedRole === role && !showInvitePanel
              return (
                <button
                  key={role}
                  onClick={() => handleRoleSelect(role)}
                  style={{
                    backgroundColor: active ? colors.activeBg : "#FFFFFF",
                    borderColor: active ? colors.activeBorder : "#E6E4DF",
                    border: '1px solid',
                    borderRadius: '16px',
                    padding: '18px 20px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: active ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
                    /* top-align content within equal-height grid cells */
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-start',
                    alignItems: 'flex-start',
                    width: '100%',
                    height: '100%',
                  }}
                >
                  <p
                    style={{
                      fontSize: '18px',
                      fontWeight: 600,
                      lineHeight: '1.3',
                      color: active ? colors.activeText : '#1E1E1C',
                      marginBottom: '6px',
                    }}
                  >
                    <strong style={{ fontWeight: 700 }}>{label}</strong>
                  </p>
                  <p style={{ fontSize: '14px', fontWeight: 400, lineHeight: '1.55', color: '#5F5F5A' }}>
                    {tagline}
                  </p>
                </button>
              )
            })}
            <button
              type="button"
              onClick={handleInviteSelect}
              style={{
                backgroundColor: showInvitePanel ? "#F5F0FF" : "#FFFFFF",
                borderColor: showInvitePanel ? "#9B8BB8" : "#E6E4DF",
                border: "1px solid",
                borderRadius: "16px",
                padding: "18px 20px",
                textAlign: "left",
                cursor: "pointer",
                transition: "all 0.15s ease",
                boxShadow: showInvitePanel ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-start",
                alignItems: "flex-start",
                width: "100%",
                height: "100%",
              }}
            >
              <p
                style={{
                  fontSize: "18px",
                  fontWeight: 600,
                  lineHeight: "1.3",
                  color: showInvitePanel ? "#4F4564" : "#1E1E1C",
                  marginBottom: "6px",
                }}
              >
                <strong style={{ fontWeight: 700 }}>Invite an artist you admire</strong>
              </p>
              <p style={{ fontSize: "14px", fontWeight: 400, lineHeight: "1.55", color: "#5F5F5A" }}>
                Share Kaleidorium with a creator you think should be discovered here.
              </p>
            </button>
          </div>
        </div>
      </div>

      {/* ── 3. Dynamic How It Works ──────────────────────────────── */}
      {selectedRole && !showInvitePanel && (
        <div ref={howItWorksRef} className="bg-[#FAFAF8]" style={{ paddingTop: '32px', paddingBottom: '32px' }}>
          <div className="container mx-auto px-4 max-w-5xl">
            <p style={{ fontSize: '20px', fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.01em', color: '#1E1E1C', textAlign: 'center', marginBottom: '24px' }}>
              How It Works
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {HOW_IT_WORKS[selectedRole].map((step, i) => (
                <div key={i} style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E6E4DF', padding: '20px', boxShadow: '0 1px 4px rgba(20,20,20,0.04)' }}>
                  <div className="w-7 h-7 rounded-full bg-[#1E1E1C] text-white text-xs font-bold flex items-center justify-center mb-3">
                    {i + 1}
                  </div>
                  <h3 className="how-it-works-title mb-2">
                    {step.title}
                  </h3>
                  <p className="how-it-works-body">
                    {step.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── 4. Role-specific form area + invite ──────────────────── */}
      {(selectedRole || showInvitePanel) && (
        <div ref={formRef} className="bg-white" style={{ paddingTop: '48px', paddingBottom: '48px' }}>
          <div className="container mx-auto px-4 max-w-xl">
            {showInvitePanel && (
              <div ref={inviteRef}>
                <InviteArtistShare />
              </div>
            )}

            {selectedRole === "collector" && !showInvitePanel && (
              <>
                <div className="text-center mb-6">
                  <h2 style={{ fontSize: 'clamp(22px,3vw,28px)', fontWeight: 700, color: '#1E1E1C', letterSpacing: '-0.015em', textAlign: 'center' }}>
                    Join as a Collector
                  </h2>
                  <p className="hero-page-intro mt-2" style={{ fontSize: '15px' }}>
                    Start discovering art through a more personal, taste-led experience.
                  </p>
                </div>
                <div className="bg-[#FAFAF8] rounded-2xl border border-[#E6E4DF] p-6 text-center">
                  <p className="body-muted mb-5" style={{ fontSize: '15px' }}>
                    Collectors register directly. Create your free account to start discovering artworks matched to your taste.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => router.push("/register")}
                  >
                    Create your free account
                  </Button>
                  <p style={{ fontSize: '13px', color: '#8A8A84', marginTop: '12px' }}>Free to join. No credit card required.</p>
                </div>
                <div className="mt-10">
                  <InviteArtistShare />
                </div>
              </>
            )}

            {selectedRole === "artist" && !showInvitePanel && (
              <>
                {artistSignupMode !== "assisted" ? (
                  <>
                    <div className="text-center mb-6">
                      <h2 style={{ fontSize: 'clamp(22px,3vw,28px)', fontWeight: 700, color: '#1E1E1C', letterSpacing: '-0.015em', textAlign: 'center' }}>
                        Get started as an artist
                      </h2>
                      <p className="hero-page-intro mt-2" style={{ fontSize: '15px' }}>
                        Choose how you would like to join Kaleidorium.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                      <div className="bg-[#FAFAF8] rounded-2xl border border-[#E6E4DF] p-6 flex flex-col">
                        <h3 className="font-sans text-sm font-bold text-black mb-2" style={{ fontSize: '16px' }}>
                          Create your account
                        </h3>
                        <p className="text-sm text-[#5F5F5A] mb-5 flex-1" style={{ lineHeight: 1.55 }}>
                          Register yourself and upload your first artwork straight away.
                        </p>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => router.push("/for-artists/register")}
                        >
                          Create your account
                        </Button>
                      </div>
                      <div className="bg-[#FAFAF8] rounded-2xl border border-[#E6E4DF] p-6 flex flex-col">
                        <h3 className="font-sans text-sm font-bold text-black mb-2" style={{ fontSize: '16px' }}>
                          Let us do it for you
                        </h3>
                        <p className="text-sm text-[#5F5F5A] mb-5 flex-1" style={{ lineHeight: 1.55 }}>
                          Send us your details and artwork information and we will create your account for you.
                        </p>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            setArtistSignupMode("assisted")
                            setTimeout(() => {
                              artistFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
                            }, 80)
                          }}
                        >
                          Let us create your account
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div ref={artistFormRef}>
                    <div className="text-center mb-6">
                      <Button
                        variant="ghost"
                        className="mb-4 text-sm text-[#5F5F5A] hover:text-[#1E1E1C]"
                        onClick={() => setArtistSignupMode(null)}
                      >
                        ← Back to options
                      </Button>
                      <h2 style={{ fontSize: 'clamp(22px,3vw,28px)', fontWeight: 700, color: '#1E1E1C', letterSpacing: '-0.015em', textAlign: 'center' }}>
                        Let us create your account
                      </h2>
                      <p className="hero-page-intro mt-2" style={{ fontSize: '15px' }}>
                        Send us your details and artwork information. We'll create your artist account and email you your login details.
                      </p>
                    </div>
                    <div className="bg-white rounded-2xl border border-[#E6E4DF] p-5" style={{ boxShadow: '0 1px 4px rgba(20,20,20,0.04)' }}>
                      <ForArtistsForm />
                    </div>
                  </div>
                )}
                <div className="mt-10">
                  <InviteArtistShare />
                </div>
              </>
            )}

            {selectedRole === "gallery" && !showInvitePanel && (
              <>
                {gallerySignupMode !== "assisted" ? (
                  <>
                    <div className="text-center mb-6">
                      <h2 style={{ fontSize: 'clamp(22px,3vw,28px)', fontWeight: 700, color: '#1E1E1C', letterSpacing: '-0.015em', textAlign: 'center' }}>
                        Get started as a gallery
                      </h2>
                      <p className="hero-page-intro mt-2" style={{ fontSize: '15px' }}>
                        Choose how you would like to join Kaleidorium.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                      <div className="bg-[#FAFAF8] rounded-2xl border border-[#E6E4DF] p-6 flex flex-col">
                        <h3 className="font-sans text-sm font-bold text-black mb-2" style={{ fontSize: '16px' }}>
                          Create your account
                        </h3>
                        <p className="text-sm text-[#5F5F5A] mb-5 flex-1" style={{ lineHeight: 1.55 }}>
                          Register yourself and set up your gallery profile straight away.
                        </p>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => router.push("/for-galleries/register")}
                        >
                          Create your account
                        </Button>
                      </div>
                      <div className="bg-[#FAFAF8] rounded-2xl border border-[#E6E4DF] p-6 flex flex-col">
                        <h3 className="font-sans text-sm font-bold text-black mb-2" style={{ fontSize: '16px' }}>
                          Let us do it for you
                        </h3>
                        <p className="text-sm text-[#5F5F5A] mb-5 flex-1" style={{ lineHeight: 1.55 }}>
                          Share your gallery details and we will create your account and upload artwork for you.
                        </p>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            setGallerySignupMode("assisted")
                            setTimeout(() => {
                              galleryFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
                            }, 80)
                          }}
                        >
                          Let us create your account
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div ref={galleryFormRef}>
                    <div className="text-center mb-6">
                      <Button
                        variant="ghost"
                        className="mb-4 text-sm text-[#5F5F5A] hover:text-[#1E1E1C]"
                        onClick={() => setGallerySignupMode(null)}
                      >
                        ← Back to options
                      </Button>
                      <h2 style={{ fontSize: 'clamp(22px,3vw,28px)', fontWeight: 700, color: '#1E1E1C', letterSpacing: '-0.015em', textAlign: 'center' }}>
                        Let us create your account
                      </h2>
                      <p className="hero-page-intro mt-2" style={{ fontSize: '15px' }}>
                        Share your gallery profile, which artists and artwork you would like to feature and we'll take care of the rest.
                      </p>
                    </div>
                    <div className="bg-white rounded-2xl border border-[#E6E4DF] p-5" style={{ boxShadow: '0 1px 4px rgba(20,20,20,0.04)' }}>
                      <ForGalleriesForm />
                    </div>
                  </div>
                )}
                <div className="mt-10">
                  <InviteArtistShare />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── 5. Unified FAQ ───────────────────────────────────────── */}
      <div className="bg-[#FAFAF8] border-t border-[#E6E4DF]" style={{ paddingTop: '48px', paddingBottom: '64px' }}>
        <div className="container mx-auto px-4 max-w-3xl">
          <p style={{ fontSize: '20px', fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.01em', color: '#1E1E1C', textAlign: 'center', marginBottom: '24px' }}>
            Frequently Asked Questions
          </p>
          <UnifiedFAQ />
        </div>
      </div>

    </div>
  )
}

