import type { Metadata } from "next"

/**
 * Crawler-facing copy only. These strings must stay accurate to the product:
 * Kaleidorium discovers art by taste, then sends interested collectors to the
 * artist or gallery. It does not sell art or take a sales commission.
 */

export const SITE_URL = "https://www.kaleidorium.com"
export const SITE_NAME = "Kaleidorium"
export const OG_IMAGE = `${SITE_URL}/logos/kaleidorium-icon-512.png`
export const ORGANIZATION_ID = `${SITE_URL}/#organization`
export const WEBSITE_ID = `${SITE_URL}/#website`
export const APP_ID = `${SITE_URL}/#app`

export const HOME_TITLE = "Kaleidorium – Discover Art Matched to Your Taste"

export type SeoPage = {
  title: string
  description: string
  path: string
  keywords?: readonly string[]
}

export const PAGES = {
  home: {
    title: HOME_TITLE,
    description:
      "Kaleidorium matches art to your taste. Collectors discover and save work for inspiration. Artists and galleries meet collectors who want to collect it.",
    path: "/",
    keywords: [
      "art discovery",
      "art for collectors",
      "art inspiration",
      "discover contemporary art",
      "artists to collect",
      "taste-based art recommendations",
      "art collector app",
      "emerging artists",
    ],
  },
  about: {
    title: "About",
    description:
      "Kaleidorium is a taste-led way to discover art. Like and swipe, save what inspires you, and follow the work back to the artist or gallery.",
    path: "/about",
    keywords: ["about Kaleidorium", "how art discovery works", "personalised art curation", "art inspiration app"],
  },
  forArtists: {
    title: "For Artists",
    description:
      "Show your art to collectors matched to your style. Kaleidorium sends interested collectors to your website. No join fee or sales commission.",
    path: "/for-artists",
    keywords: [
      "artists seeking collectors",
      "get art discovered",
      "list artwork for collectors",
      "show art to collectors",
      "art discovery for artists",
    ],
  },
  forGalleries: {
    title: "For Galleries",
    description:
      "Present your artists to collectors based on taste. Kaleidorium sends interested collectors to your gallery website. No join fee or sales commission.",
    path: "/for-galleries",
    keywords: [
      "galleries seeking collectors",
      "reach art collectors",
      "list gallery artists",
      "collector discovery for galleries",
    ],
  },
  featured: {
    title: "Featured Artist",
    description:
      "Explore featured art on Kaleidorium, including paintings by Lisa Wong Sook Kuan. Save what inspires you and visit the artist directly.",
    path: "/featured",
    keywords: ["featured artist", "Lisa Wong Sook Kuan", "contemporary paintings", "art inspiration"],
  },
  contact: {
    title: "Contact",
    description:
      "Questions about discovering art, or about listing work as an artist or gallery? Contact Kaleidorium at kurator@kaleidorium.com.",
    path: "/contact",
    keywords: ["contact Kaleidorium", "list artwork", "join as an artist", "join as a gallery"],
  },
  register: {
    title: "Register as a Collector",
    description:
      "Create a free Kaleidorium account to discover art matched to your taste, save a collection, and follow artists you love.",
    path: "/register",
    keywords: ["register art collector", "free art discovery account", "save art collection"],
  },
  login: {
    title: "Log in",
    description:
      "Log in to Kaleidorium to keep discovering art matched to your taste and return to the work you have saved.",
    path: "/login",
    keywords: ["Kaleidorium login", "art collector login"],
  },
  artistRegister: {
    title: "List Your Art",
    description:
      "Apply to list your artwork on Kaleidorium. Approved work is shown to collectors whose taste fits yours, with a link back to you.",
    path: "/for-artists/register",
    keywords: ["submit artwork", "artist application", "be discovered by collectors"],
  },
  galleryRegister: {
    title: "List Your Gallery",
    description:
      "Apply to present your artists on Kaleidorium and reach collectors looking for work they want to live with.",
    path: "/for-galleries/register",
    keywords: ["gallery application", "list artists", "reach art collectors"],
  },
  terms: {
    title: "Terms of Service",
    description:
      "Terms of Service for Kaleidorium, the taste-led art discovery app for collectors, artists and galleries.",
    path: "/terms",
  },
  privacy: {
    title: "Privacy and Data Policy",
    description:
      "Privacy and data policy for Kaleidorium. How collector, artist and gallery information is handled.",
    path: "/privacy",
  },
} as const satisfies Record<string, SeoPage>

export const HOW_IT_WORKS_DESCRIPTION =
  "See how Kaleidorium works for collectors, artists and galleries. Taste-led discovery, with a direct path from interest to the artist."

export const PRICING_DESCRIPTION =
  "In 2026, Kaleidorium is free for collectors, artists and galleries. Collectors keep free access."

/** FAQ copy matches the questions on the How it works page. */
export const HOW_IT_WORKS_FAQ: { question: string; answer: string }[] = [
  {
    question: "What is Kaleidorium?",
    answer:
      "Kaleidorium is a personalised art discovery app that connects collectors, artists and galleries through taste-led discovery.",
  },
  {
    question: "Are you a marketplace or a gallery?",
    answer:
      "No. Kaleidorium is not a marketplace nor a gallery. We do not facilitate any transaction. We connect artists and collectors. We're not part of any conversation or transaction that follows.",
  },
  {
    question: "How will my artwork be shown to collectors?",
    answer:
      "Your work is not displayed side-by-side in a crowded feed. Instead, it's shown individually to collectors whose preferences suggest they'll genuinely appreciate it. We use a personalised matching approach, more like a curator than a catalogue.",
  },
  {
    question: "What happens when collectors are interested?",
    answer:
      "Each artwork links directly to your own website, online store, or gallery page. Kaleidorium does not handle transactions. We simply bring qualified, interested collectors to you. If you're represented by a gallery, you can set your redirect link to point there instead.",
  },
  {
    question: "Is Kaleidorium free for collectors?",
    answer: "Yes. Collectors can discover, save and explore artworks for free.",
  },
  {
    question: "How does Kaleidorium learn my taste?",
    answer: "Your Kurator gets smarter as you like, dislike and explore artworks over time.",
  },
  {
    question: "Do artists join immediately?",
    answer:
      "We will review the artwork you submitted for listing. If there are any issues with your submission we will contact you on the email provided.",
  },
  {
    question: "What if I'm not selected?",
    answer:
      "We're curating a high-quality experience for both artists and collectors. If you're not selected initially, you can always reapply with updated work.",
  },
  {
    question: "Why should I join as an artist?",
    answer: "Kaleidorium helps get your art in front of collectors who are more likely to appreciate it.",
  },
  {
    question: "Do galleries join immediately?",
    answer:
      "We will review the artists and artwork you submitted for listing. If there are any issues with your submission we will contact you on the email provided.",
  },
  {
    question: "Can galleries showcase multiple artists?",
    answer: "Yes. Galleries can present multiple artists and artworks through one profile.",
  },
  {
    question: "Why should I join as a gallery?",
    answer: "Kaleidorium helps grow your collector base by putting the right works in front of the right audience.",
  },
  {
    question: "Is Kaleidorium free?",
    answer: "Yes. Kaleidorium is completely free for artists and galleries.",
  },
  {
    question: "Do you charge commissions?",
    answer: "No. We do not take commissions on sales. Collectors are directed to your website or preferred contact method.",
  },
  {
    question: "Will there be charges in the future?",
    answer:
      "Possibly. We expect to introduce optional subscription plans in the future as the platform grows. Existing members will be informed well in advance.",
  },
  {
    question: "Will I be charged automatically?",
    answer: "No. You will never be charged without your explicit agreement.",
  },
  {
    question: "Why did you create Kaleidorium?",
    answer:
      "We've seen too many brilliant artists struggle to get noticed. In a world overflowing with content, being good is no longer enough — you also need to be found. Kaleidorium helps solve this by curating artwork to match each collector's taste, increasing the chance of discovery and appreciation.",
  },
]

const PRIVATE_VIEWS = new Set(["collection", "profile", "taste-profile"])

export function absoluteUrl(path: string): string {
  if (path.startsWith("http")) return path
  return `${SITE_URL}${path === "/" ? "/" : path}`
}

export function fullTitle(title: string): string {
  if (title.includes(SITE_NAME)) return title
  return `${title} · ${SITE_NAME}`
}

export function pageMetadata(page: SeoPage): Metadata {
  const url = absoluteUrl(page.path)
  const titled = fullTitle(page.title)
  return {
    title: { absolute: fullTitle(page.title) },
    description: page.description,
    keywords: page.keywords ? [...page.keywords] : undefined,
    alternates: { canonical: url },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      url,
      title: titled,
      description: page.description,
      siteName: SITE_NAME,
      images: [
        {
          url: OG_IMAGE,
          width: 512,
          height: 512,
          alt: "Kaleidorium, taste-led art discovery for collectors, artists and galleries",
        },
      ],
    },
    twitter: {
      card: "summary",
      title: titled,
      description: page.description,
      images: [OG_IMAGE],
      creator: "@kaleidorium",
      site: "@kaleidorium",
    },
  }
}

function faqEntities(items: { question: string; answer: string }[]) {
  return items.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  }))
}

export function webPageJsonLd(page: SeoPage) {
  const url = absoluteUrl(page.path)
  const crumbs = [
    { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
    { "@type": "ListItem", position: 2, name: page.title, item: url },
  ]
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        url,
        name: fullTitle(page.title),
        description: page.description,
        inLanguage: "en",
        isPartOf: { "@id": WEBSITE_ID },
        about: { "@id": APP_ID },
        breadcrumb: { "@id": `${url}#breadcrumb` },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumb`,
        itemListElement: crumbs,
      },
    ],
  }
}

export function siteJsonLd() {
  const home = PAGES.home
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": ORGANIZATION_ID,
        name: SITE_NAME,
        url: `${SITE_URL}/`,
        logo: {
          "@type": "ImageObject",
          url: OG_IMAGE,
          width: 512,
          height: 512,
        },
        description: home.description,
        email: "kurator@kaleidorium.com",
        sameAs: ["https://www.instagram.com/kaleidorium/"],
        contactPoint: {
          "@type": "ContactPoint",
          email: "kurator@kaleidorium.com",
          contactType: "customer support",
          availableLanguage: "English",
        },
      },
      {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        name: SITE_NAME,
        url: `${SITE_URL}/`,
        description: home.description,
        inLanguage: "en",
        publisher: { "@id": ORGANIZATION_ID },
      },
      {
        "@type": "WebApplication",
        "@id": APP_ID,
        name: SITE_NAME,
        url: `${SITE_URL}/`,
        description: home.description,
        applicationCategory: "LifestyleApplication",
        operatingSystem: "Web",
        browserRequirements: "Requires JavaScript. Works in any modern browser.",
        isAccessibleForFree: true,
        inLanguage: "en",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
          description: "Free for collectors. Artists and galleries join without a fee or a sales commission.",
        },
        featureList: [
          "Taste-led art discovery for collectors looking for inspiration",
          "Save artworks into a personal collection",
          "Direct links from an artwork to the artist or gallery",
          "Artists and galleries matched with collectors who are likely to appreciate the work",
        ],
        audience: [
          { "@type": "PeopleAudience", audienceType: "Art collectors" },
          { "@type": "PeopleAudience", audienceType: "Artists" },
          { "@type": "PeopleAudience", audienceType: "Art galleries" },
        ],
        provider: { "@id": ORGANIZATION_ID },
      },
    ],
  }
}

function viewPage(name: string, description: string, url: string, audience: string) {
  return {
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    url,
    name,
    description,
    inLanguage: "en",
    isPartOf: { "@id": WEBSITE_ID },
    about: { "@id": APP_ID },
    audience: { "@type": "PeopleAudience", audienceType: audience },
  }
}

export function canonicalForView(view: string, role: string | null): string {
  if (view === "why-kaleidorium") {
    if (role === "artist") return absoluteUrl(PAGES.forArtists.path)
    if (role === "gallery") return absoluteUrl(PAGES.forGalleries.path)
    return `${SITE_URL}/?view=why-kaleidorium`
  }
  if (view === "about") return absoluteUrl(PAGES.about.path)
  if (view === "for-artists") return absoluteUrl(PAGES.forArtists.path)
  if (view === "for-galleries") return absoluteUrl(PAGES.forGalleries.path)
  if (view === "contact") return absoluteUrl(PAGES.contact.path)
  if (view === "terms") return absoluteUrl(PAGES.terms.path)
  if (view === "privacy") return absoluteUrl(PAGES.privacy.path)
  if (view === "pricing") return `${SITE_URL}/?view=pricing`
  return SITE_URL
}

export function descriptionForView(view: string, role: string | null): string {
  if (PRIVATE_VIEWS.has(view)) return PAGES.home.description
  if (view === "why-kaleidorium") {
    if (role === "artist") return PAGES.forArtists.description
    if (role === "gallery") return PAGES.forGalleries.description
    return HOW_IT_WORKS_DESCRIPTION
  }
  if (view === "about") return PAGES.about.description
  if (view === "for-artists") return PAGES.forArtists.description
  if (view === "for-galleries") return PAGES.forGalleries.description
  if (view === "contact") return PAGES.contact.description
  if (view === "pricing") return PRICING_DESCRIPTION
  if (view === "terms") return PAGES.terms.description
  if (view === "privacy") return PAGES.privacy.description
  return PAGES.home.description
}

export function jsonLdForView(view: string, role: string | null) {
  if (PRIVATE_VIEWS.has(view)) return null

  if (view === "why-kaleidorium") {
    const artist = role === "artist"
    const gallery = role === "gallery"
    const url = artist
      ? absoluteUrl(PAGES.forArtists.path)
      : gallery
        ? absoluteUrl(PAGES.forGalleries.path)
        : `${SITE_URL}/?view=why-kaleidorium`
    const name = artist
      ? fullTitle(PAGES.forArtists.title)
      : gallery
        ? fullTitle(PAGES.forGalleries.title)
        : fullTitle("How it works")
    const description = artist
      ? PAGES.forArtists.description
      : gallery
        ? PAGES.forGalleries.description
        : HOW_IT_WORKS_DESCRIPTION
    const audience = artist ? "Artists" : gallery ? "Art galleries" : "Art collectors, artists and galleries"
    return {
      "@context": "https://schema.org",
      "@graph": [
        viewPage(name, description, url, audience),
        {
          "@type": "FAQPage",
          "@id": `${url}#faq`,
          url,
          isPartOf: { "@id": WEBSITE_ID },
          mainEntity: faqEntities(HOW_IT_WORKS_FAQ),
        },
      ],
    }
  }

  if (view === "discover") {
    return {
      "@context": "https://schema.org",
      "@graph": [
        viewPage(
          HOME_TITLE,
          PAGES.home.description,
          `${SITE_URL}/`,
          "Art collectors looking for inspiration"
        ),
      ],
    }
  }

  const page =
    view === "about"
      ? PAGES.about
      : view === "for-artists"
        ? PAGES.forArtists
        : view === "for-galleries"
          ? PAGES.forGalleries
          : view === "contact"
            ? PAGES.contact
            : view === "terms"
              ? PAGES.terms
              : view === "privacy"
                ? PAGES.privacy
                : null

  if (page) {
    const graph: Record<string, unknown>[] = [
      viewPage(fullTitle(page.title), page.description, absoluteUrl(page.path), "Art collectors, artists and galleries"),
    ]
    if (view === "contact") {
      graph[0] = {
        ...graph[0],
        "@type": "ContactPage",
      }
    }
    return { "@context": "https://schema.org", "@graph": graph }
  }

  if (view === "pricing") {
    return {
      "@context": "https://schema.org",
      "@graph": [
        viewPage(fullTitle("Pricing"), PRICING_DESCRIPTION, `${SITE_URL}/?view=pricing`, "Art collectors, artists and galleries"),
      ],
    }
  }

  return null
}
