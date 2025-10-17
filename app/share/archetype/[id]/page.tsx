import { Metadata } from 'next'
import { getArchetypeById } from '@/lib/collector-archetypes'
import { notFound } from 'next/navigation'

interface PageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const archetype = getArchetypeById(params.id)
  
  if (!archetype) {
    return {
      title: 'Collector Archetype - Kaleidorium',
      description: 'Discover your collector archetype at Kaleidorium.com'
    }
  }

  const shareText = `I'm a ${archetype.name}! Discover your collector archetype at Kaleidorium.com`
  const imageUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://kaleidorium.com'}${archetype.imagePath}`

  return {
    title: `${archetype.name} - Kaleidorium`,
    description: shareText,
    openGraph: {
      title: archetype.name,
      description: shareText,
      images: [
        {
          url: imageUrl,
          width: 512,
          height: 512,
          alt: archetype.name,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: archetype.name,
      description: shareText,
      images: [imageUrl],
    },
  }
}

export default function ArchetypeSharePage({ params }: PageProps) {
  const archetype = getArchetypeById(params.id)
  
  if (!archetype) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full text-center">
        {/* Archetype Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-8 mb-8 shadow-lg">
          <div className="flex flex-col items-center space-y-6">
            {/* Archetype Image */}
            <div className="w-48 h-48 rounded-lg overflow-hidden bg-gray-100">
              <img
                src={archetype.imagePath}
                alt={archetype.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Archetype Info */}
            <div className="text-center">
              <h1 className="text-3xl font-bold text-black mb-2">{archetype.name}</h1>
              <div className="flex justify-center mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  archetype.category === 'intellectual' ? 'bg-blue-100 text-blue-800' :
                  archetype.category === 'financial' ? 'bg-green-100 text-green-800' :
                  'bg-purple-100 text-purple-800'
                }`}>
                  {archetype.category.charAt(0).toUpperCase() + archetype.category.slice(1)}
                </span>
              </div>
              <p className="text-lg text-gray-700 leading-relaxed max-w-lg mx-auto">
                {archetype.description}
              </p>
            </div>
          </div>
        </div>
        
        {/* Call to Action */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-black mb-4">
            Discover Your Own Collector Archetype
          </h2>
          <p className="text-gray-600 mb-6">
            Visit Kaleidorium to analyze your art collection and find out what type of collector you are.
          </p>
          <a 
            href="https://kaleidorium.com"
            className="inline-block bg-black text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
          >
            Visit Kaleidorium
          </a>
        </div>
        
        {/* Redirect Script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Redirect to main site after 3 seconds
              setTimeout(() => {
                window.location.href = 'https://kaleidorium.com';
              }, 3000);
            `,
          }}
        />
      </div>
    </div>
  )
}
