/** @type {import('next').NextConfig} */
// Cache bust: 2024-08-31-12:25 - Override Vercel's default CSP
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
  // Override Vercel's default CSP with permissive settings
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self' 'unsafe-inline' 'unsafe-eval' *",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' * blob: data:",
              "style-src 'self' 'unsafe-inline' *",
              "img-src 'self' data: blob: *",
              "font-src 'self' data: *",
              "connect-src 'self' *",
              "frame-src *",
              "object-src *",
              "media-src *"
            ].join('; ')
          }
        ]
      }
    ]
  },
  experimental: {
    serverComponentsExternalPackages: ['sharp'],
  },
}

module.exports = nextConfig 