"use client"

import { useState } from "react"
import { Share2, Copy, Twitter, Facebook, Linkedin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { CollectorArchetype } from "@/lib/collector-archetypes"

interface CollectorArchetypeCardProps {
  archetype: CollectorArchetype
  onShare?: () => void
}

export function CollectorArchetypeCard({ archetype, onShare }: CollectorArchetypeCardProps) {
  const [showShareMenu, setShowShareMenu] = useState(false)
  const { toast } = useToast()

  const handleShare = async (platform: string) => {
    const shareText = `I'm a ${archetype.name}! Discover your collector archetype at Kaleidorium.com`
    const shareUrl = window.location.origin

    try {
      switch (platform) {
        case 'twitter':
          window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank')
          break
        case 'facebook':
          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`, '_blank')
          break
        case 'linkedin':
          window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank')
          break
        case 'copy':
          await navigator.clipboard.writeText(`${shareText} ${shareUrl}`)
          toast({
            title: "Copied to clipboard!",
            description: "Share your collector archetype with friends!"
          })
          break
      }
      setShowShareMenu(false)
      onShare?.()
    } catch (error) {
      toast({
        title: "Share failed",
        description: "Unable to share. Please try again.",
        variant: "destructive"
      })
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
              <img
                src={archetype.imagePath}
                alt={archetype.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-black mb-1">{archetype.name}</h3>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  archetype.category === 'intellectual' ? 'bg-blue-100 text-blue-800' :
                  archetype.category === 'financial' ? 'bg-green-100 text-green-800' :
                  'bg-purple-100 text-purple-800'
                }`}>
                  {archetype.category.charAt(0).toUpperCase() + archetype.category.slice(1)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="h-8 w-8 p-0"
            >
              <Share2 className="h-4 w-4" />
            </Button>
            
            {showShareMenu && (
              <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-10 min-w-[160px]">
                <button
                  onClick={() => handleShare('twitter')}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-100 rounded"
                >
                  <Twitter className="h-4 w-4 text-blue-400" />
                  <span>Twitter</span>
                </button>
                <button
                  onClick={() => handleShare('facebook')}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-100 rounded"
                >
                  <Facebook className="h-4 w-4 text-blue-600" />
                  <span>Facebook</span>
                </button>
                <button
                  onClick={() => handleShare('linkedin')}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-100 rounded"
                >
                  <Linkedin className="h-4 w-4 text-blue-700" />
                  <span>LinkedIn</span>
                </button>
                <button
                  onClick={() => handleShare('copy')}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-100 rounded"
                >
                  <Copy className="h-4 w-4 text-gray-600" />
                  <span>Copy Link</span>
                </button>
              </div>
            )}
          </div>
        </div>
        
        <p className="text-sm text-gray-700 leading-relaxed">
          {archetype.description}
        </p>
      </CardContent>
    </Card>
  )
}
