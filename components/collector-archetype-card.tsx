"use client"

import { useState } from "react"
import { Copy, Facebook, Instagram, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { CollectorArchetype } from "@/lib/collector-archetypes"

// X Icon component to match existing design
const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
)

interface CollectorArchetypeCardProps {
  archetype: CollectorArchetype
  onShare?: () => void
}

export function CollectorArchetypeCard({ archetype, onShare }: CollectorArchetypeCardProps) {
  const { toast } = useToast()

  const handleShare = async (platform: string) => {
    const shareText = `I'm a ${archetype.name}! Discover your collector archetype at Kaleidorium.com`
    const shareUrl = `${window.location.origin}/share/archetype/${archetype.id}`
    const imageUrl = `${window.location.origin}${archetype.imagePath}`

    try {
      switch (platform) {
        case 'twitter':
          const twitterText = `Check out my collector archetype: ${archetype.name} on Kaleidorium`
          window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterText)}&url=${encodeURIComponent(shareUrl)}`, '_blank', 'noopener,noreferrer')
          break
        case 'facebook':
          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank', 'noopener,noreferrer')
          break
        case 'instagram':
          // Instagram doesn't support direct sharing via URL, so we'll copy the content
          await navigator.clipboard.writeText(`${shareText}\n\n${imageUrl}\n${shareUrl}`)
          toast({
            title: "Copied to clipboard!",
            description: "Paste this in your Instagram story or post!"
          })
          break
        case 'whatsapp':
          const whatsappText = `${shareText}\n\n${shareUrl}`
          window.open(`https://wa.me/?text=${encodeURIComponent(whatsappText)}`, '_blank', 'noopener,noreferrer')
          break
        case 'copy':
          await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`)
          toast({
            title: "Copied to clipboard!",
            description: "Share your collector archetype with friends!"
          })
          break
      }
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
            <div className="w-48 h-48 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
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
          
        </div>
        
        <p className="text-sm text-gray-700 leading-relaxed">
          {archetype.description}
        </p>
        
        {/* Social Media Share Buttons - Matching existing style */}
        <div className="pt-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-3">Share this archetype</p>
            <div className="flex justify-center gap-2">
              <button 
                className="w-10 h-10 border border-black bg-white rounded-full flex items-center justify-center hover:bg-black hover:text-white transition-all duration-200"
                onClick={() => handleShare('twitter')}
                title="Share on X"
              >
                <XIcon className="w-5 h-5" />
              </button>
              <button 
                className="w-10 h-10 border border-black bg-white rounded-full flex items-center justify-center hover:bg-black hover:text-white transition-all duration-200"
                onClick={() => handleShare('facebook')}
                title="Share on Facebook"
              >
                <Facebook className="w-5 h-5" />
              </button>
              <button 
                className="w-10 h-10 border border-black bg-white rounded-full flex items-center justify-center hover:bg-black hover:text-white transition-all duration-200"
                onClick={() => handleShare('instagram')}
                title="Share on Instagram"
              >
                <Instagram className="w-5 h-5" />
              </button>
              <button 
                className="w-10 h-10 border border-black bg-white rounded-full flex items-center justify-center hover:bg-black hover:text-white transition-all duration-200"
                onClick={() => handleShare('whatsapp')}
                title="Share on WhatsApp"
              >
                <MessageCircle className="w-5 h-5" />
              </button>
              <button 
                className="w-10 h-10 border border-black bg-white rounded-full flex items-center justify-center hover:bg-black hover:text-white transition-all duration-200"
                onClick={() => handleShare('copy')}
                title="Copy Link"
              >
                <Copy className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
