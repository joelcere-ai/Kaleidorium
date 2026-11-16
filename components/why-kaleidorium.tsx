"use client"

import { useState, useEffect, useRef, Fragment } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronRight, ChevronUp, Lightbulb, Mail, Sparkles, Upload } from "lucide-react"
import { InviteArtistShare } from "@/components/invite-artist-share"

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = "collector" | "artist" | "gallery"

// ─── How-It-Works data ────────────────────────────────────────────────────────

const HOW_IT_WORKS: Record<Role, { title: string; body: string }[]> = {
  collector: [
    {
      title: "Discover Art That Fits Your Taste",
      body: "Swipe or like artworks and tell your Kurator what you love.",
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
}[] = [
  {
    role: "collector",
    label: "Collector",
    tagline: "Discover art tailored to your taste and champion emerging artists.",
  },
  {
    role: "artist",
    label: "Artist",
    tagline: "Get your work in front of collectors who will truly appreciate it.",
  },
  {
    role: "gallery",
    label: "Gallery",
    tagline: "Grow your collector base effortlessly.",
  },
]

const GOOD_TO_KNOW: Record<Role, string> = {
  collector:
    "Your taste stays yours. You choose what to save, how you explore, and when you connect with artists.",
  artist:
    "You stay in control. You decide what to share, where collectors go and how you connect.",
  gallery:
    "You stay in control. You decide what to showcase, where collectors go and how inquiries reach you.",
}

const HERO_IMAGES = [
  { src: "/Onboarding-images/For Collectors/Hennie_3__The_Visitor___120x100cm__Oil__1754903123908.jpg", alt: "The Visitor" },
  { src: "/Onboarding-images/For Collectors/Josignacio_4_Josignacio_s_Rhapsody_Blue_1754903114939.jpg", alt: "Rhapsody Blue" },
  { src: "/Onboarding-images/For Collectors/Peterson_5_Isometric_Pixel_Art_by_Peterso_1754903119020.gif", alt: "Isometric Pixel Art" },
  { src: "/Onboarding-images/For Collectors/Steampunk3_1755249065054.png", alt: "Steampunk" },
  { src: "/Onboarding-images/For Collectors/Theo_3_677_To_Theo_van_Gogh__Arles__S_1754903144275.jpg", alt: "To Theo" },
  { src: "/Onboarding-images/For Collectors/xcopy_2_XCOPY_LAST_SELFIE_4K.gif", alt: "Last Selfie" },
]

// ─── Hero artwork strip ───────────────────────────────────────────────────────

function ArtworkStrip() {
  const [activeIndex, setActiveIndex] = useState(0)

  return (
    <>
      <div className="hiw-artwork-strip-desktop" aria-hidden="true">
        {HERO_IMAGES.map((img) => (
          <div key={img.src} className="hiw-artwork-thumb">
            <img src={img.src} alt="" />
          </div>
        ))}
      </div>
      <div className="hiw-artwork-strip-mobile">
        <div className="hiw-artwork-thumb">
          <img src={HERO_IMAGES[activeIndex].src} alt={HERO_IMAGES[activeIndex].alt} />
        </div>
        <div className="hiw-artwork-dots" role="tablist" aria-label="Artwork carousel">
          {HERO_IMAGES.map((img, i) => (
            <button
              key={img.src}
              type="button"
              role="tab"
              aria-selected={i === activeIndex}
              aria-label={`Show artwork ${i + 1}`}
              className={`hiw-artwork-dot${i === activeIndex ? " is-active" : ""}`}
              onClick={() => setActiveIndex(i)}
            />
          ))}
        </div>
      </div>
    </>
  )
}

// ─── Step illustrations ───────────────────────────────────────────────────────

function MatchArtworkVisual({ compact }: { compact?: boolean }) {
  return (
    <div className={compact ? "hiw-visual--compact" : undefined}>
      <div className="hiw-visual-artwork" aria-hidden="true">
        <div className="hiw-visual-action hiw-visual-action--dislike">
          <svg className="hiw-action-glyph" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M7 7l10 10M17 7L7 17" />
          </svg>
        </div>
        <div className="hiw-visual-action hiw-visual-action--like">
          <svg className="hiw-action-glyph" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20.5s-6.5-4.2-6.5-9.1C5.5 8.1 7.6 6 10.2 6c1.5 0 2.9.7 3.8 1.8.9-1.1 2.3-1.8 3.8-1.8 2.6 0 4.7 2.1 4.7 5.4 0 4.9-6.5 9.1-6.5 9.1z" />
          </svg>
        </div>
      </div>
    </div>
  )
}

function TrackChartVisual() {
  return (
    <div className="hiw-visual-chart" aria-hidden="true">
      <svg viewBox="0 0 80 52" fill="none">
        <path d="M6 40 L24 28 L40 34 L58 16 L74 22" stroke="#C4B5FD" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="24" cy="28" r="3.5" fill="#8B5CF6" />
        <circle cx="40" cy="34" r="3.5" fill="#8B5CF6" />
        <circle cx="58" cy="16" r="3.5" fill="#8B5CF6" />
        <circle cx="74" cy="22" r="4" fill="#7C3AED" />
      </svg>
    </div>
  )
}

function ConnectVisual() {
  return (
    <div className="hiw-visual-connect" aria-hidden="true">
      <div className="hiw-visual-avatar hiw-visual-avatar--a" />
      <div className="hiw-visual-envelope">
        <Mail className="h-3 w-3" />
      </div>
      <div className="hiw-visual-avatar hiw-visual-avatar--b" />
    </div>
  )
}

function StepIllustration({ role, index, compact }: { role: Role; index: number; compact?: boolean }) {
  const wrap = (node: React.ReactNode) => (
    compact ? <div className="hiw-visual--compact">{node}</div> : node
  )

  if (role === "collector") {
    if (index === 0) return wrap(<div className="hiw-visual-swipe" aria-hidden="true" />)
    if (index === 1) {
      return wrap(
        <div className="hiw-visual-sparkle" aria-hidden="true">
          <Sparkles className="h-4 w-4" />
        </div>
      )
    }
    if (index === 2) {
      return wrap(
        <div className="hiw-visual-collection" aria-hidden="true">
          <span /><span /><span /><span />
        </div>
      )
    }
    return wrap(
      <div className="hiw-visual-link" aria-hidden="true">
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 13v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <path d="M15 3h6v6" />
          <path d="M10 14 21 3" />
        </svg>
      </div>
    )
  }

  if (role === "artist") {
    if (index === 0) {
      return wrap(
        <div className="hiw-visual-frame" aria-hidden="true">
          <div className="hiw-visual-upload-btn">
            <Upload className="h-2.5 w-2.5" />
          </div>
        </div>
      )
    }
    if (index === 1) return <MatchArtworkVisual compact={compact} />
    if (index === 2) return <TrackChartVisual />
    return <ConnectVisual />
  }

  if (index === 0) {
    return wrap(
      <div className="hiw-visual-gallery-frames" aria-hidden="true">
        <span /><span /><span />
      </div>
    )
  }
  if (index === 1) return <MatchArtworkVisual compact={compact} />
  if (index === 2) return <TrackChartVisual />
  return wrap(
    <div className="hiw-visual-grow" aria-hidden="true">
      <span /><span /><span />
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
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D9CFF7] text-sm"
          placeholder="Your artist name" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-800 mb-1">Email</label>
        <input type="email" name="email" value={formData.email} onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D9CFF7] text-sm"
          placeholder="your@email.com" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-800 mb-1">Portfolio / Website / Instagram Link</label>
        <input type="text" name="portfolioLink" value={formData.portfolioLink}
          onChange={handleChange} onBlur={handlePortfolioBlur}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D9CFF7] text-sm"
          placeholder="Link to your portfolio, website or Instagram" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-800 mb-1">Artwork Details</label>
        <textarea name="artworkDetails" value={formData.artworkDetails} onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D9CFF7] text-sm resize-y min-h-[144px]"
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
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D9CFF7] text-sm"
          placeholder="Your gallery name" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-800 mb-1">Gallery Website</label>
        <input type="url" name="website" value={formData.website} onChange={handleChange} onBlur={handleWebsiteBlur}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D9CFF7] text-sm"
          placeholder="www.yourgallery.com" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-800 mb-1">Contact Name</label>
        <input type="text" name="contactName" value={formData.contactName} onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D9CFF7] text-sm"
          placeholder="Your name" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-800 mb-1">Email</label>
        <input type="email" name="email" value={formData.email} onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D9CFF7] text-sm"
          placeholder="your@email.com" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-800 mb-1">Tell us which artists and artwork you would like to list</label>
        <textarea name="message" value={formData.message} onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D9CFF7] text-sm resize-y min-h-[144px]"
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
  const [selectedRole, setSelectedRole] = useState<Role | null>(initialRole ?? "collector")
  const [showInvitePanel, setShowInvitePanel] = useState(false)
  const [artistSignupMode, setArtistSignupMode] = useState<"assisted" | null>(null)
  const [gallerySignupMode, setGallerySignupMode] = useState<"assisted" | null>(null)
  const [expandedStep, setExpandedStep] = useState<number | null>(0)
  const inviteRef = useRef<HTMLDivElement>(null)
  const artistFormRef = useRef<HTMLDivElement>(null)
  const galleryFormRef = useRef<HTMLDivElement>(null)

  // How it works opens on the collector path. Artist and gallery links override it.
  const searchParams = useSearchParams()
  const roleParam = searchParams.get("role")
  const landingRole: Role | null =
    roleParam === "artist" || roleParam === "gallery" || roleParam === "collector" ? roleParam : null

  useEffect(() => {
    setSelectedRole(landingRole ?? "collector")
  }, [landingRole])

  const handleRoleSelect = (role: Role) => {
    setShowInvitePanel(false)
    setArtistSignupMode(null)
    setGallerySignupMode(null)
    setSelectedRole(role)
    setExpandedStep(0)
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
    <div className="hiw-page flex-1 overflow-y-auto">

      {/* Hero */}
      <section className="hiw-hero">
        <div className="hiw-hero-inner">
          {landingRole === "artist" ? (
            <h1 className="hiw-hero-title hiw-hero-title--statement">
              Get your work in front of collectors who will truly appreciate it.
            </h1>
          ) : landingRole === "gallery" ? (
            <h1 className="hiw-hero-title hiw-hero-title--statement">
              Grow your collector base effortlessly.
            </h1>
          ) : (
            <>
              <h1 className="hiw-hero-title">Art, Matched to Taste</h1>
              <p className="hiw-hero-subtitle">
                Whether you collect, create or represent art, Kaleidorium helps the right works find the right audience.
              </p>
            </>
          )}
          <ArtworkStrip />
        </div>
      </section>

      {/* Role selector — only on How it works. Artist and gallery pages are already that path. */}
      {landingRole !== "artist" && landingRole !== "gallery" && (
      <section className="hiw-explore">
        <div className="hiw-explore-inner">
          <h2 className="hiw-section-title">Explore how it works</h2>

          <div className="hiw-role-grid">
            {ROLE_CARDS.map(({ role, label, tagline }) => {
              const active = selectedRole === role && !showInvitePanel
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleRoleSelect(role)}
                  className={`hiw-role-card${active ? " is-active" : ""}`}
                >
                  <span className="hiw-role-card-label">{label}</span>
                  <span className="hiw-role-card-tagline">{tagline}</span>
                </button>
              )
            })}
            <button
              type="button"
              onClick={handleInviteSelect}
              className={`hiw-role-card${showInvitePanel ? " is-active" : ""}`}
            >
              <span className="hiw-role-card-label">Invite an artist you admire</span>
              <span className="hiw-role-card-tagline">
                Share Kaleidorium with a creator you think should be discovered here.
              </span>
            </button>
          </div>

          <div className="hiw-role-list">
            {ROLE_CARDS.map(({ role, label, tagline }) => {
              const active = selectedRole === role && !showInvitePanel
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleRoleSelect(role)}
                  className={`hiw-role-list-item${active ? " is-active" : ""}`}
                >
                  <span className="hiw-role-list-text">
                    <span className="hiw-role-list-label">{label}</span>
                    <span className="hiw-role-list-tagline">{tagline}</span>
                  </span>
                  <ChevronRight className="hiw-role-list-chevron h-4 w-4" />
                </button>
              )
            })}
            <button
              type="button"
              onClick={handleInviteSelect}
              className={`hiw-role-list-item${showInvitePanel ? " is-active" : ""}`}
            >
              <span className="hiw-role-list-text">
                <span className="hiw-role-list-label">Invite an artist you admire</span>
                <span className="hiw-role-list-tagline">
                  Share Kaleidorium with a creator you think should be discovered here.
                </span>
              </span>
              <ChevronRight className="hiw-role-list-chevron h-4 w-4" />
            </button>
          </div>
        </div>
      </section>
      )}

      {/* How It Works */}
      {selectedRole && !showInvitePanel && (
        <section ref={howItWorksRef} className="hiw-steps-section">
          <div className="hiw-steps-inner">
            <h2 className="hiw-section-title">How It Works</h2>

            <div className="hiw-steps-flow">
              {HOW_IT_WORKS[selectedRole].map((step, i) => (
                <Fragment key={step.title}>
                  <div className="hiw-step-card">
                    <div className="hiw-step-number">{i + 1}</div>
                    <div className="hiw-step-visual-wrap">
                      <StepIllustration role={selectedRole} index={i} />
                    </div>
                    <h3 className="hiw-step-title">{step.title}</h3>
                    <p className="hiw-step-body">{step.body}</p>
                  </div>
                  {i < HOW_IT_WORKS[selectedRole].length - 1 && (
                    <div className="hiw-step-connector" aria-hidden="true" />
                  )}
                </Fragment>
              ))}
            </div>

            <div className="hiw-steps-accordion">
              {HOW_IT_WORKS[selectedRole].map((step, i) => {
                const isOpen = expandedStep === i
                return (
                  <div key={step.title} className="hiw-step-accordion-item">
                    <button
                      type="button"
                      className="hiw-step-accordion-trigger"
                      onClick={() => setExpandedStep(isOpen ? null : i)}
                      aria-expanded={isOpen}
                    >
                      <span className="hiw-step-number">{i + 1}</span>
                      <div className="hiw-step-visual-wrap">
                        <StepIllustration role={selectedRole} index={i} compact />
                      </div>
                      <span className="hiw-step-title">{step.title}</span>
                      <ChevronDown className={`hiw-step-accordion-chevron h-4 w-4${isOpen ? " is-open" : ""}`} />
                    </button>
                    {isOpen && <p className="hiw-step-accordion-body">{step.body}</p>}
                  </div>
                )
              })}
            </div>

            <div className="hiw-good-to-know">
              <div className="hiw-good-to-know-icon">
                <Lightbulb className="h-4 w-4" />
              </div>
              <div>
                <p className="hiw-good-to-know-title">Good to know</p>
                <p className="hiw-good-to-know-text">{GOOD_TO_KNOW[selectedRole]}</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Role-specific forms */}
      {(selectedRole || showInvitePanel) && (
        <section ref={formRef} className="hiw-form-section">
          <div className="hiw-form-inner">
            {showInvitePanel && (
              <div ref={inviteRef}>
                <InviteArtistShare />
              </div>
            )}

            {selectedRole === "collector" && !showInvitePanel && (
              <>
                <h2 className="hiw-form-heading">Join as a Collector</h2>
                <p className="hiw-form-subheading">
                  Start discovering art through a more personal, taste-led experience.
                </p>
                <div className="hiw-form-card text-center">
                  <p className="text-[15px] leading-relaxed text-[#5F5F5A] mb-5">
                    Collectors register directly. Create your free account to start discovering artworks matched to your taste.
                  </p>
                  <Button variant="outline" onClick={() => router.push("/register")}>
                    Create your free account
                  </Button>
                  <p className="text-[13px] text-[#8A8A84] mt-3">Free to join. No credit card required.</p>
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
                    <h2 className="hiw-form-heading">Get started as an artist</h2>
                    <p className="hiw-form-subheading">Choose how you would like to join Kaleidorium.</p>
                    <div className="hiw-form-option-grid">
                      <div className="hiw-form-option">
                        <h3>Create your account</h3>
                        <p>Register yourself and upload your first artwork straight away.</p>
                        <Button variant="outline" className="w-full" onClick={() => router.push("/for-artists/register")}>
                          Create your account
                        </Button>
                      </div>
                      <div className="hiw-form-option">
                        <h3>Let us do it for you</h3>
                        <p>Send us your details and artwork information and we will create your account for you.</p>
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
                    <Button
                      variant="ghost"
                      className="mb-4 text-sm text-[#5F5F5A] hover:text-[#1E1E1C]"
                      onClick={() => setArtistSignupMode(null)}
                    >
                      ← Back to options
                    </Button>
                    <h2 className="hiw-form-heading">Let us create your account</h2>
                    <p className="hiw-form-subheading">
                      Send us your details and artwork information. We&apos;ll create your artist account and email you your login details.
                    </p>
                    <div className="hiw-form-card bg-white">
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
                    <h2 className="hiw-form-heading">Get started as a gallery</h2>
                    <p className="hiw-form-subheading">Choose how you would like to join Kaleidorium.</p>
                    <div className="hiw-form-option-grid">
                      <div className="hiw-form-option">
                        <h3>Create your account</h3>
                        <p>Register yourself and set up your gallery profile straight away.</p>
                        <Button variant="outline" className="w-full" onClick={() => router.push("/for-galleries/register")}>
                          Create your account
                        </Button>
                      </div>
                      <div className="hiw-form-option">
                        <h3>Let us do it for you</h3>
                        <p>Share your gallery details and we will create your account and upload artwork for you.</p>
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
                    <Button
                      variant="ghost"
                      className="mb-4 text-sm text-[#5F5F5A] hover:text-[#1E1E1C]"
                      onClick={() => setGallerySignupMode(null)}
                    >
                      ← Back to options
                    </Button>
                    <h2 className="hiw-form-heading">Let us create your account</h2>
                    <p className="hiw-form-subheading">
                      Share your gallery profile, which artists and artwork you would like to feature and we&apos;ll take care of the rest.
                    </p>
                    <div className="hiw-form-card bg-white">
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
        </section>
      )}

      {/* FAQ */}
      <section className="hiw-faq-section">
        <div className="hiw-faq-inner">
          <h2 className="hiw-section-title">Frequently Asked Questions</h2>
          <UnifiedFAQ />
        </div>
      </section>

    </div>
  )
}

