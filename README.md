# BlockMeister / Kaleidorium

An AI-powered art curation and marketplace platform that connects artists with collectors through intelligent artwork analysis and secure portfolio management.

## 🎨 Platform Overview

**BlockMeister** (also known as **Kaleidorium**) is a sophisticated art platform featuring:

- **AI-Powered Curation**: Kurator AI assistant generates professional artwork descriptions, tags, and market insights
- **Artist Portfolio Management**: Secure registration, profile creation, and artwork uploads
- **Collector Discovery**: Browse curated artworks with AI-generated descriptions and metadata
- **Secure File Handling**: Enterprise-grade security for artwork uploads with malware scanning
- **Email Integration**: Automated notifications and admin communications

## 🛠️ Technical Stack

### Frontend
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **shadcn/ui** component library
- **React Hook Form** for form handling

### Backend & Infrastructure
- **Supabase** - Database, Authentication, Storage
- **OpenAI Assistant API** - Kurator AI for artwork analysis
- **EmailJS** - Email integration
- **Row Level Security (RLS)** - Database security
- **Vercel** deployment ready

### Security Features
- Content Security Policy (CSP)
- Security headers (HSTS, X-Frame-Options, etc.)
- File upload validation and malware scanning
- Authentication middleware
- Secure error handling and logging

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- OpenAI API account
- EmailJS account

### Installation

1. **Clone and install dependencies:**
```bash
cd blockmeister
npm install
```

2. **Environment Setup:**
Create `.env.local` with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key
KURATOR_ASSISTANT_ID=your_assistant_id

# EmailJS Configuration  
NEXT_PUBLIC_EMAILJS_SERVICE_ID=your_service_id
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=your_template_id
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=your_public_key

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. **Database Setup:**
Run the migrations in the `migrations/` folder:
```sql
-- Execute these in your Supabase SQL editor
migrations/20240316_storage_bucket.sql
migrations/20240316_storage_policies.sql  
migrations/20240609_add_role_to_collectors.sql
```

4. **Start Development Server:**
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 📁 Project Structure

```
blockmeister/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── ai-art-description/   # AI description generation
│   │   ├── kurator-tags/         # Kurator AI assistant
│   │   ├── upload-artwork/       # Secure file uploads
│   │   ├── invite-artist/        # Artist invitation system
│   │   └── ...                   # Other API endpoints
│   ├── for-artists/register/     # Artist registration flow
│   ├── admin/                    # Admin dashboard
│   ├── auth/                     # Authentication pages
│   └── ...                       # Other pages
├── components/                   # React components
│   ├── ui/                       # shadcn/ui components
│   ├── secure-artwork-upload.tsx # File upload component
│   ├── art-discovery.tsx         # Artwork browsing
│   └── ...                       # Other components
├── lib/                          # Utility libraries
│   ├── supabase.ts              # Database client
│   ├── secure-artwork-upload.ts # File validation
│   ├── auth-middleware.ts       # Authentication
│   └── ...                       # Other utilities
├── migrations/                   # Database migrations
├── public/                       # Static assets
└── types/                        # TypeScript definitions
```

## 🎯 Key Features

### Artist Registration & Portfolio
- Invitation-based artist onboarding
- Secure profile picture uploads
- Portfolio submission with AI analysis
- Email validation and notifications

### AI-Powered Artwork Analysis (Kurator)
- Generates professional artwork descriptions
- Extracts metadata (genre, style, colors, keywords)
- References similar work by notable artists
- Market positioning insights

### Secure File Upload System
- Multi-layer validation (file type, size, content)
- Malware scanning and signature detection
- Temporary storage for registration process
- Supabase storage integration with RLS

### Admin Features
- Artist invitation management
- Portfolio review and approval
- System monitoring and logs
- User account management

## 🔐 Security Implementation

### File Upload Security
- **Content validation**: Magic number verification
- **Size limits**: Configurable file size restrictions  
- **Malware scanning**: Executable signature detection
- **Type restrictions**: Image files only for artwork
- **Temporary isolation**: Staging uploads before approval

### Authentication & Authorization
- **Supabase Auth**: Secure user management
- **Row Level Security**: Database-level access control
- **Admin roles**: Restricted administrative functions
- **Session management**: Secure token handling

### Security Headers
```javascript
// Implemented in next.config.js
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: comprehensive CSP with img-src blob: support
```

## 🤖 AI Integration (Kurator)

The Kurator AI assistant uses OpenAI's Assistant API to:

1. **Analyze artwork images** submitted during registration
2. **Generate professional descriptions** without generic preambles
3. **Extract structured metadata**:
   - Genre and artistic style
   - Color palette and subject matter
   - Relevant keywords for discovery
4. **Provide market context** with references to notable artists

Example Kurator output:
```json
{
  "description": "A unifying field of vibrant chartreuse radiates energy, embodying a minimalist aesthetic that evokes the Colour Field paintings of Ellsworth Kelly...",
  "genre": "Digital",
  "style": "Minimalism", 
  "subject": "colour study",
  "colour": "Chartreuse",
  "keywords": ["minimalist", "monochrome", "vibrant"]
}
```

## 📧 Email Integration

Uses EmailJS for:
- Artist invitation emails
- Registration confirmations  
- Admin notifications
- Portfolio submission alerts

## 🚀 Deployment

### Vercel Deployment
```bash
# Deploy to Vercel
npm run build
vercel --prod
```

### Environment Variables
Ensure all environment variables are set in your deployment platform:
- Supabase credentials
- OpenAI API key and assistant ID
- EmailJS configuration
- Production app URL

## 🧪 Development Commands

```bash
# Development server with file watching
npm run dev

# Production build
npm run build

# Start production server  
npm start

# Linting
npm run lint

# Kill server processes (if needed)
pkill -f "next-server"
```

## 📋 Database Schema

### Key Tables
- **collectors**: User profiles and authentication
- **artists**: Artist-specific information and portfolios  
- **artworks**: Artwork metadata and storage references
- **artwork_images**: Image storage bucket management

### Storage Buckets
- `artwork-images`: Permanent artwork storage
- `artwork-images/temp`: Temporary uploads during registration
- `profile-pictures`: User profile images

## 🐛 Common Issues & Solutions

### FileReader Errors
- **Issue**: "FileReader is not defined" in server-side code
- **Solution**: Use `file.arrayBuffer()` instead of FileReader for server validation

### Port Conflicts
- **Issue**: Port 3000 already in use
- **Solution**: `pkill -f "next-server" && npm run dev`

### CSP Blocking Images
- **Issue**: Image previews not showing
- **Solution**: Added `blob:` to img-src in CSP configuration

### OpenAI API Format Errors
- **Issue**: Data URLs rejected by Assistant API
- **Solution**: Store temporary files in Supabase to generate HTTP URLs

## 🤝 Contributing

1. Follow TypeScript strict mode guidelines
2. Use the established component patterns
3. Maintain security best practices
4. Test file upload functionality thoroughly
5. Update this README for significant changes

## 📄 License

This project is proprietary software for BlockMeister/Kaleidorium platform.

---

**Built with ❤️ using Next.js, Supabase, and OpenAI**
