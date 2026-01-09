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
  title: "Kaleidorium – Your Personal Art Curator",
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
    title: 'Kaleidorium – Your Personal Art Curator',
    description: 'Your personal art curator. Swipe. Discover. Fall in Love (with Art).',
    siteName: 'Kaleidorium',
    images: [
      {
        url: '/logos/pwa-icon-512x512-v3.jpg',
        width: 512,
        height: 512,
        alt: 'Kaleidorium - Art Discovery Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kaleidorium – Your Personal Art Curator',
    description: 'Your personal art curator. Swipe. Discover. Fall in Love (with Art).',
    images: ['/logos/pwa-icon-512x512-v3.jpg'],
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
        url: '/logos/favicon-32x32-v4.jpg',
        type: 'image/jpeg',
      },
      {
        url: '/logos/favicon-16x16-v4.jpg',
        sizes: '16x16',
        type: 'image/jpeg',
      },
      {
        url: '/logos/favicon-32x32-v4.jpg',
        sizes: '32x32',
        type: 'image/jpeg',
      },
      {
        url: '/logos/pwa-icon-192x192-v3.jpg',
        sizes: '192x192',
        type: 'image/jpeg',
      },
      {
        url: '/logos/pwa-icon-512x512-v3.jpg',
        sizes: '512x512',
        type: 'image/jpeg',
      }
    ],
    apple: [
      {
        url: '/logos/apple-touch-icon-180x180-v3.jpg',
        sizes: '180x180',
        type: 'image/jpeg',
      }
    ],
    shortcut: '/logos/favicon-32x32-v4.jpg'
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
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
        <meta name="build-version" content="v9-cache-bust-2024-12-19-1200" />
        {/* Favicon Links - Explicit to override browser cache - v4 with white background */}
        <link rel="icon" type="image/jpeg" sizes="16x16" href="/logos/favicon-16x16-v4.jpg?v=6" />
        <link rel="icon" type="image/jpeg" sizes="32x32" href="/logos/favicon-32x32-v4.jpg?v=6" />
        <link rel="icon" type="image/jpeg" sizes="48x48" href="/logos/favicon-48x48-v4.jpg?v=6" />
        <link rel="shortcut icon" type="image/jpeg" href="/logos/favicon-32x32-v4.jpg?v=6" />
        <link rel="icon" type="image/jpeg" href="/logos/favicon-32x32-v4.jpg?v=6" />
        <link rel="apple-touch-icon" sizes="180x180" href="/logos/apple-touch-icon-180x180-v3.jpg?v=6" />
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />
        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  try {
                    navigator.serviceWorker.register('/sw.js')
                      .then((registration) => {
                        console.log('Service Worker registered successfully:', registration.scope);
                      })
                      .catch((error) => {
                        // Silently fail - service worker is optional for PWA
                        console.log('Service Worker registration failed (non-critical):', error.message);
                      });
                  } catch (error) {
                    // Silently fail - don't break the app
                    console.log('Service Worker registration error (non-critical)');
                  }
                });
              }
            `,
          }}
        />
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

