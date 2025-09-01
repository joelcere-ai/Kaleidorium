/** @type {import('next').NextConfig} */
// Cache bust: 2024-08-31-12:30 - Removed Google Analytics, simplified CSP
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
  // Simplified CSP without Google Analytics
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://api.emailjs.com https://cdn.jsdelivr.net",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://*.supabase.co",
              "font-src 'self' data:",
              "connect-src 'self' https://api.emailjs.com https://*.supabase.co https://api.openai.com",
              "frame-src 'none'",
              "object-src 'none'"
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