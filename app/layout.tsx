import type React from "react"
import type { Metadata } from "next"
import { Playfair_Display } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { CookieConsent } from "@/components/cookie-consent"
import { Footer } from "@/components/footer"
import { MobileInstallPrompt } from "@/components/mobile-install-prompt"

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
})

export const metadata: Metadata = {
  title: "Discover Contemporary & Digital Art Curated For You | Kaleidorium",
  description: "Swipe, match, and discover digital and contemporary art curated to your taste. Kaleidorium connects artists and collectors to make finding art you love easier.",
  keywords: [
    "digital art finder",
    "contemporary art online", 
    "NFT alternatives",
    "swipe art discovery",
    "art collector platform",
    "match artists with collectors",
    "AI art curation",
    "online art gallery",
    "curated art collection",
    "art discovery platform",
    "digital art marketplace",
    "contemporary art gallery"
  ],
  authors: [{ name: "Kaleidorium" }],
  creator: "Kaleidorium",
  publisher: "Kaleidorium",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.kaleidorium.com',
    title: 'Kaleidorium – Discover & Collect Art Curated For You',
    description: 'Swipe, discover, and fall in love with art. We connect collectors with artists through a unique swipe-based experience.',
    siteName: 'Kaleidorium',
    images: [
      {
        url: '/android-chrome-512x512.png',
        width: 512,
        height: 512,
        alt: 'Kaleidorium - Art Discovery Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kaleidorium – Discover & Collect Art Curated For You',
    description: 'Swipe, discover, and fall in love with art. We connect collectors with artists through a unique swipe-based experience.',
    images: ['/android-chrome-512x512.png'],
    creator: '@kaleidorium',
    site: '@kaleidorium',
  },
  alternates: {
    canonical: 'https://www.kaleidorium.com',
  },
  category: 'Art & Culture',
  classification: 'Art Discovery Platform',
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Kaleidorium",
  },
  icons: {
    icon: [
      {
        url: '/favicon.ico',
        type: 'image/x-icon',
      },
      {
        url: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        url: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      }
    ],
    apple: [
      {
        url: '/icons/icon-152x152.png',
        sizes: '152x152',
      },
      {
        url: '/icons/icon-192x192.png',
        sizes: '192x192',
      }
    ]
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'theme-color': '#000000',
    'msapplication-TileColor': '#000000',
    'application-name': 'Kaleidorium',
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Google Analytics removed to fix CSP issues - will reinstall later */}
        {/* 🚨 CACHE BUST: Force browser refresh */}
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
        <meta name="build-version" content="v4-force-refresh-2024-09-22-1140" />
      </head>
      <body className={`${playfair.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
          forcedTheme="light"
        >
          {children}
          <Footer />
          <CookieConsent />
          <MobileInstallPrompt />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}

