/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'zeexxekmnbbntnmwfcat.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/artwork-images/**',
      },
    ],
    domains: ['zeexxekmnbbntnmwfcat.supabase.co'],
  },
  env: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  // Temporarily disable CSP to fix Google Analytics
  // async headers() {
  //   return [
  //     {
  //       source: '/:path*',
  //       headers: [
  //         {
  //           key: 'Content-Security-Policy',
  //           value: process.env.NODE_ENV === 'development' 
  //             ? [
  //                 "default-src 'self'",
  //                 "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://api.emailjs.com https://cdn.jsdelivr.net",
  //                 "connect-src 'self' https://api.emailjs.com https://*.supabase.co https://api.openai.com",
  //                 "style-src 'self' 'unsafe-inline'",
  //                 "img-src 'self' data: blob: https://*.supabase.co",
  //                 "font-src 'self' data:",
  //                 "frame-src 'none'",
  //                 "object-src 'none'",
  //                 "base-uri 'self'",
  //                 "form-action 'self'"
  //               ].join('; ')
  //             : [
  //                 "default-src 'self'",
  //                 "script-src 'self' 'unsafe-inline' https://api.emailjs.com https://cdn.jsdelivr.net https://www.googletagmanager.com",
  //                 "connect-src 'self' https://api.emailjs.com https://*.supabase.co https://api.openai.com https://www.google-analytics.com https://analytics.google.com",
  //                 "style-src 'self' 'unsafe-inline'",
  //                 "img-src 'self' data: blob: https://*.supabase.co https://www.google-analytics.com",
  //                 "font-src 'self' data:",
  //                 "frame-src 'none'",
  //                 "object-src 'none'",
  //                 "base-uri 'self'",
  //                 "form-action 'self'"
  //               ].join('; ')
  //         },
  //         {
  //           key: 'X-Frame-Options',
  //           value: 'DENY'
  //         },
  //         {
  //           key: 'X-Content-Type-Options',
  //           value: 'nosniff'
  //         },
  //         {
  //           key: 'X-XSS-Protection',
  //           value: '1; mode=block'
  //         },
  //         {
  //           key: 'Referrer-Policy',
  //           value: 'strict-origin-when-cross-origin'
  //         },
  //         {
  //           key: 'Permissions-Policy',
  //           value: 'camera=(), microphone=(), geolocation=()'
  //         }
  //       ],
  //     },
  //   ]
  // },
  experimental: {
    serverComponentsExternalPackages: ['sharp'],
  },
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Add any custom webpack config here
    return config
  },
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  
  // Configure webpack for better development experience
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Enable hot reloading
      config.watchOptions = {
        poll: 1000, // Check for changes every second
        aggregateTimeout: 300, // Delay before rebuilding
        ignored: ['**/node_modules', '**/.git', '**/.next'],
      }
    }
    return config
  },

  // Increase page generation timeout
  staticPageGenerationTimeout: 1000,

  // Enable more detailed error reporting
  onDemandEntries: {
    // period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 60 * 1000,
    // number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 5,
  }
}

module.exports = nextConfig 