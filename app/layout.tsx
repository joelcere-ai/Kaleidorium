import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { CookieConsent } from "@/components/cookie-consent"
import { Footer } from "@/components/footer"
import { MobileInstallPrompt } from "@/components/mobile-install-prompt"
import { NavigationProvider } from "@/components/navigation-context"
import { RouteJsonLd } from "@/components/route-json-ld"
import { HOME_TITLE, PAGES, SITE_URL, siteJsonLd } from "@/lib/seo"


export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: HOME_TITLE,
    template: "%s · Kaleidorium",
  },
  description: PAGES.home.description,
  keywords: [...PAGES.home.keywords],
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
    url: SITE_URL,
    title: HOME_TITLE,
    description: PAGES.home.description,
    siteName: 'Kaleidorium',
    images: [
      {
        url: '/logos/kaleidorium-icon-512.png',
        width: 512,
        height: 512,
        alt: 'Kaleidorium, taste-led art discovery for collectors, artists and galleries',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: HOME_TITLE,
    description: PAGES.home.description,
    images: ['/logos/kaleidorium-icon-512.png'],
    creator: '@kaleidorium',
    site: '@kaleidorium',
  },
  alternates: {
    canonical: SITE_URL,
    types: {
      'text/plain': `${SITE_URL}/llms.txt`,
    },
  },
  category: 'Art',
  classification: 'Art discovery for collectors, artists and galleries',
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Kaleidorium",
  },
  icons: {
    icon: [
      {
        url: '/logos/kaleidorium-icon-32.png',
        type: 'image/png',
      },
      {
        url: '/logos/kaleidorium-icon-16.png',
        sizes: '16x16',
        type: 'image/png',
      },
      {
        url: '/logos/kaleidorium-icon-32.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        url: '/logos/kaleidorium-icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        url: '/logos/kaleidorium-icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      }
    ],
    apple: [
      {
        url: '/logos/kaleidorium-icon-180.png',
        sizes: '180x180',
        type: 'image/png',
      }
    ],
    shortcut: '/logos/kaleidorium-icon-32.png'
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'theme-color': '#FFFFFF',
    'msapplication-TileColor': '#000000',
    'application-name': 'Kaleidorium',
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Favicon - Load FIRST to prevent flash of old favicon */}
        <link rel="icon" type="image/x-icon" href="/favicon.ico?v=14" />
        <link rel="icon" type="image/png" sizes="16x16" href="/logos/kaleidorium-icon-16.png?v=14" />
        <link rel="icon" type="image/png" sizes="32x32" href="/logos/kaleidorium-icon-32.png?v=14" />
        <link rel="icon" type="image/png" sizes="48x48" href="/logos/kaleidorium-icon-48.png?v=14" />
        <link rel="shortcut icon" type="image/x-icon" href="/favicon.ico?v=14" />
        <link rel="apple-touch-icon" sizes="180x180" href="/logos/kaleidorium-icon-180.png?v=14" />
        <link rel="alternate" type="text/plain" href="/llms.txt" title="LLM-readable site summary" />
        <RouteJsonLd data={siteJsonLd()} />
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
        <meta name="build-version" content="v14-logo-2026-09-04" />
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json?v=14" />
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
      <body className={`${inter.variable} antialiased`}>
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

