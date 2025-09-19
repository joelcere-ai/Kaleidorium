/** @type {import('next').NextConfig} */
// Cache bust: 2024-08-31-12:35 - Remove all CSP to fix EmailJS
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
  experimental: {
    serverComponentsExternalPackages: ['sharp'],
  },
  // Increase body size limits for artwork uploads
  api: {
    bodyParser: {
      sizeLimit: '25mb',
    },
  },
}

module.exports = nextConfig 