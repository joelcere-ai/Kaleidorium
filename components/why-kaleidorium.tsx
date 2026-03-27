"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ChevronDown, ChevronUp } from "lucide-react"

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
      title: "Upload Your Artwork",
      body: "Create your profile, upload your work and link collectors to your own website or portfolio.",
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
      body: "Create your gallery profile and present the artworks you want collectors to discover.",
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
    tagline: "Discover art tailored to your taste",
    colors: {
      bg: "#F6FBF8", border: "#CFE5D8", text: "#2F6B4F",
      activeBg: "#EDF7F2", activeBorder: "#2F6B4F", activeText: "#1D4D38",
    },
  },
  {
    role: "artist",
    label: "Artist",
    tagline: "Get your art in front of collectors who will appreciate it",
    colors: {
      bg: "#FAFAFA", border: "#D8D8D8", text: "#222222",
      activeBg: "#FFFFFF", activeBorder: "#222222", activeText: "#000000",
    },
  },
  {
    role: "gallery",
    label: "Gallery",
    tagline: "Grow your collector base",
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
      <p className="text-xs text-gray-400 text-center mb-2" style={{ fontFamily: "Arial, sans-serif" }}>
        Art, matched to taste
      </p>
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

// ─── Artist portfolio form (existing — unchanged) ──────────────────────────────

function ForArtistsForm() {
  const [formData, setFormData] = useState({ name: "", email: "", portfolioLink: "" })
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
        setFormData({ name: "", email: "", portfolioLink: "" })
      } else {
        setSubmitStatus("There was an error submitting your portfolio. Please try again.")
      }
    } catch {
      setSubmitStatus("There was an error submitting your portfolio. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
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
        <label className="block text-sm font-medium text-gray-800 mb-1">Name</label>
        <input type="text" name="name" value={formData.name} onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black text-sm"
          placeholder="Your full name" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-800 mb-1">Email</label>
        <input type="email" name="email" value={formData.email} onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black text-sm"
          placeholder="your@email.com" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-800 mb-1">Portfolio Link</label>
        <input type="url" name="portfolioLink" value={formData.portfolioLink}
          onChange={handleChange} onBlur={handlePortfolioBlur}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black text-sm"
          placeholder="www.yourportfolio.com" required />
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-full bg-black text-white hover:bg-gray-800">
        {isSubmitting ? "Submitting…" : "Submit Portfolio"}
      </Button>
      <p className="text-xs text-gray-500 leading-relaxed">
        We will only use this information to review your portfolio and notify you. Unused submissions are deleted within one week.
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
        <label className="block text-sm font-medium text-gray-800 mb-1">Tell us about your gallery</label>
        <textarea name="message" value={formData.message} onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black text-sm"
          placeholder="Tell us about your gallery and which artists you would like to list…"
          rows={4} required />
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-full bg-black text-white hover:bg-gray-800">
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
  { id: "artist-join", q: "Do artists join immediately?", a: "Artists currently apply by submitting a portfolio for review. If selected, they will be invited to complete their artist profile on Kaleidorium." },
  { id: "not-selected", q: "What if I'm not selected?", a: "We're curating a high-quality experience for both artists and collectors. If you're not selected initially, you can always reapply with updated work." },
  { id: "why-artist", q: "Why should I join as an artist?", a: "Kaleidorium helps get your art in front of collectors who are more likely to appreciate it." },
  { id: "gallery-join", q: "Do galleries join immediately?", a: "Galleries currently apply by submitting their website or portfolio for review. If selected, they will be invited to complete their gallery profile on Kaleidorium." },
  { id: "gallery-multi", q: "Can galleries showcase multiple artists?", a: "Yes. Galleries can present multiple artists and artworks through one profile." },
  { id: "why-gallery", q: "Why should I join as a gallery?", a: "Kaleidorium helps grow your collector base by putting the right works in front of the right audience." },
  { id: "cost", q: "How much does it cost for artists and galleries?", a: "Free for all in 2026. In 2027, we will introduce a modest subscription fee. Check out our pricing page. No hidden surprises." },
  { id: "commission", q: "Do you take commission during beta?", a: "No commission during beta. Kaleidorium is focused on discovery and qualified interest." },
  { id: "why-created", q: "Why did you create Kaleidorium?", a: "We've seen too many brilliant artists struggle to get noticed. In a world overflowing with content, being good is no longer enough — you also need to be found. Kaleidorium helps solve this by curating artwork to match each collector's taste, increasing the chance of discovery and appreciation." },
]

function UnifiedFAQ() {
  const [open, setOpen] = useState<string | null>(null)
  return (
    <div className="space-y-2">
      {FAQ_ITEMS.map((item) => (
        <div key={item.id} className="border border-gray-200 rounded-lg overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-semibold text-gray-900 hover:bg-gray-50 transition-colors"
            onClick={() => setOpen(open === item.id ? null : item.id)}
          >
            <span>{item.q}</span>
            {open === item.id ? <ChevronUp className="h-4 w-4 flex-shrink-0 text-gray-400" /> : <ChevronDown className="h-4 w-4 flex-shrink-0 text-gray-400" />}
          </button>
          {open === item.id && (
            <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
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
    setSelectedRole(role)
    onRoleChange?.(role)
    // Update URL query param without full navigation
    const url = new URL(window.location.href)
    url.searchParams.set("role", role)
    window.history.replaceState(null, "", url.toString())
    // Scroll to How It Works so users see the value prop before the form
    setTimeout(() => {
      howItWorksRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 80)
  }

  return (
    <div className="flex-1 overflow-y-auto bg-white">

      {/* ── 1. Hero ──────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-gray-50 to-white py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Intro text — full width above the grid */}
          <div className="text-center mb-8">
            <h1
              className="text-3xl lg:text-4xl font-serif font-bold text-black mb-3 leading-tight"
              style={{ fontFamily: "Times New Roman, serif" }}
            >
              Join Kaleidorium
            </h1>
            <p className="text-base text-gray-600 leading-relaxed max-w-xl mx-auto" style={{ fontFamily: "Arial, sans-serif" }}>
              Whether you collect, create or represent art, Kaleidorium helps the right works find the right audience. Choose how you'd like to join below.
            </p>
          </div>
          {/* Artwork grid — full width below */}
          <ArtworkGrid />
        </div>
      </div>

      {/* ── 2. Role selector ─────────────────────────────────────── */}
      <div className="py-12 bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2
            className="text-xl font-semibold text-gray-900 text-center mb-8"
            style={{ fontFamily: "Arial, sans-serif" }}
          >
            How would you like to join?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {ROLE_CARDS.map(({ role, label, tagline, colors }) => {
              const active = selectedRole === role
              return (
                <button
                  key={role}
                  onClick={() => handleRoleSelect(role)}
                  style={{
                    backgroundColor: active ? colors.activeBg : colors.bg,
                    borderColor: active ? colors.activeBorder : colors.border,
                    boxShadow: active ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
                  }}
                  className="rounded-xl px-5 py-5 text-left transition-all duration-200 border"
                >
                  <p
                    className="text-base font-bold mb-1"
                    style={{ color: active ? colors.activeText : colors.text }}
                  >
                    {label}
                  </p>
                  <p className="text-sm leading-snug" style={{ color: active ? colors.text : "#6B7280" }}>
                    {tagline}
                  </p>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── 3. Dynamic How It Works ──────────────────────────────── */}
      {selectedRole && (
        <div ref={howItWorksRef} className="py-12 bg-gray-50">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2
              className="text-xl font-semibold text-gray-900 text-center mb-8"
              style={{ fontFamily: "Arial, sans-serif" }}
            >
              How It Works
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {HOW_IT_WORKS[selectedRole].map((step, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                  <div className="w-7 h-7 rounded-full bg-black text-white text-xs font-bold flex items-center justify-center mb-3">
                    {i + 1}
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2" style={{ fontFamily: "Arial, sans-serif" }}>
                    {step.title}
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed" style={{ fontFamily: "Arial, sans-serif" }}>
                    {step.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── 4. Role-specific form area ───────────────────────────── */}
      {selectedRole && (
        <div ref={formRef} className="py-12 bg-white">
          <div className="container mx-auto px-4 max-w-2xl">
            {selectedRole === "collector" && (
              <>
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-serif font-bold text-black mb-2" style={{ fontFamily: "Times New Roman, serif" }}>
                    Join as a Collector
                  </h2>
                  <p className="text-sm text-gray-600" style={{ fontFamily: "Arial, sans-serif" }}>
                    Start discovering art through a more personal, taste-led experience.
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-8 text-center">
                  <p className="text-sm text-gray-600 mb-6 leading-relaxed" style={{ fontFamily: "Arial, sans-serif" }}>
                    Collectors register directly. Create your free account to start discovering artworks matched to your taste.
                  </p>
                  <Button
                    className="bg-black text-white hover:bg-gray-800 px-8 py-3 text-sm font-medium"
                    onClick={() => router.push("/register")}
                  >
                    Create your free account
                  </Button>
                  <p className="text-xs text-gray-400 mt-4">Free to join. No credit card required.</p>
                </div>
              </>
            )}

            {selectedRole === "artist" && (
              <>
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-serif font-bold text-black mb-2" style={{ fontFamily: "Times New Roman, serif" }}>
                    Submit Your Portfolio
                  </h2>
                  <p className="text-sm text-gray-600" style={{ fontFamily: "Arial, sans-serif" }}>
                    Share your work for review. If selected, we'll invite you to join Kaleidorium as an artist.
                  </p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <ForArtistsForm />
                </div>
              </>
            )}

            {selectedRole === "gallery" && (
              <>
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-serif font-bold text-black mb-2" style={{ fontFamily: "Times New Roman, serif" }}>
                    Submit Your Gallery for Review
                  </h2>
                  <p className="text-sm text-gray-600" style={{ fontFamily: "Arial, sans-serif" }}>
                    Share your gallery website or portfolio for review. If selected, we'll invite you to join Kaleidorium as a gallery.
                  </p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <ForGalleriesForm />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── 5. Unified FAQ ───────────────────────────────────────── */}
      <div className="py-12 bg-gray-50 border-t border-gray-100">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2
            className="text-xl font-semibold text-gray-900 text-center mb-8"
            style={{ fontFamily: "Arial, sans-serif" }}
          >
            Frequently Asked Questions
          </h2>
          <UnifiedFAQ />
        </div>
      </div>

    </div>
  )
}
