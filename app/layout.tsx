import type React from "react"
import type { Metadata } from "next"
import { Playfair_Display } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { CookieConsent } from "@/components/cookie-consent"
import { Footer } from "@/components/footer"
import { MobileInstallPrompt } from "@/components/mobile-install-prompt"
import { NavigationProvider } from "@/components/navigation-context"

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
})

export const metadata: Metadata = {
  title: "Discover Contemporary & Digital Art Curated For You | Kaleidorium",
  description: "Your personal art curator. Swipe. Discover. Fall in Love (with Art).",
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
    description: 'Your personal art curator. Swipe. Discover. Fall in Love (with Art).',
    siteName: 'Kaleidorium',
    images: [
      {
        url: '/logos/pwa-icon-512x512.svg?v=2',
        width: 512,
        height: 512,
        alt: 'Kaleidorium - Art Discovery Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kaleidorium – Discover & Collect Art Curated For You',
    description: 'Your personal art curator. Swipe. Discover. Fall in Love (with Art).',
    images: ['/logos/pwa-icon-512x512.svg?v=2'],
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
        url: '/logos/favicon-32x32.svg?v=2',
        type: 'image/svg+xml',
      },
      {
        url: '/logos/favicon-16x16.svg?v=2',
        sizes: '16x16',
        type: 'image/svg+xml',
      },
      {
        url: '/logos/favicon-32x32.svg?v=2',
        sizes: '32x32',
        type: 'image/svg+xml',
      },
      {
        url: '/logos/pwa-icon-192x192.svg?v=2',
        sizes: '192x192',
        type: 'image/svg+xml',
      },
      {
        url: '/logos/pwa-icon-512x512.svg?v=2',
        sizes: '512x512',
        type: 'image/svg+xml',
      }
    ],
    apple: [
      {
        url: '/logos/apple-touch-icon-180x180.svg?v=2',
        sizes: '180x180',
        type: 'image/svg+xml',
      }
    ],
    shortcut: '/logos/favicon-32x32.svg?v=2'
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
        {/* Google Analytics */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-6NYJYN06VB"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-6NYJYN06VB');
            `,
          }}
        />
        {/* 🚨 CACHE BUST: Force browser refresh */}
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
            <meta name="build-version" content="v8-force-active-2024-09-26-1135" />
      </head>
      <body className={`${playfair.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
          forcedTheme="light"
        >
          <NavigationProvider>
            {children}
            <Footer />
            <CookieConsent />
            <MobileInstallPrompt />
            <Toaster />
          </NavigationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

