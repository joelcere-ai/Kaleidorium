"use client"

import { useState } from "react"
import { Copy, Facebook, Instagram, MessageCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { CollectorArchetype } from "@/lib/collector-archetypes"

const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
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
        case "twitter": {
          const twitterText = `Check out my collector archetype: ${archetype.name} on Kaleidorium`
          window.open(
            `https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterText)}&url=${encodeURIComponent(shareUrl)}`,
            "_blank",
            "noopener,noreferrer"
          )
          break
        }
        case "facebook":
          window.open(
            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
            "_blank",
            "noopener,noreferrer"
          )
          break
        case "instagram":
          await navigator.clipboard.writeText(`${shareText}\n\n${imageUrl}\n${shareUrl}`)
          toast({
            title: "Copied to clipboard!",
            description: "Paste this in your Instagram story or post!",
          })
          break
        case "whatsapp": {
          const whatsappText = `${shareText}\n\n${shareUrl}`
          window.open(
            `https://wa.me/?text=${encodeURIComponent(whatsappText)}`,
            "_blank",
            "noopener,noreferrer"
          )
          break
        }
        case "copy":
          await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`)
          toast({
            title: "Copied to clipboard!",
            description: "Share your collector archetype with friends!",
          })
          break
      }
      onShare?.()
    } catch {
      toast({
        title: "Share failed",
        description: "Unable to share. Please try again.",
        variant: "destructive",
      })
    }
  }

  const categoryLabel =
    archetype.category.charAt(0).toUpperCase() + archetype.category.slice(1)

  return (
    <article className="taste-archetype-card">
      <div className="taste-archetype-image-wrap">
        <img
          src={archetype.imagePath}
          alt={archetype.name}
          className="taste-archetype-image"
        />
      </div>

      <div className="taste-archetype-content">
        <div className="taste-archetype-heading">
          <h3 className="taste-archetype-title">{archetype.name}</h3>
          <span className="taste-archetype-tag">{categoryLabel}</span>
        </div>

        <p className="taste-archetype-description">{archetype.description}</p>

        <div className="taste-archetype-share">
          <p className="taste-archetype-share-label">Share this archetype</p>
          <div className="taste-archetype-share-buttons">
            <button
              type="button"
              className="taste-share-icon-btn"
              onClick={() => handleShare("twitter")}
              title="Share on X"
            >
              <XIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="taste-share-icon-btn"
              onClick={() => handleShare("facebook")}
              title="Share on Facebook"
            >
              <Facebook className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="taste-share-icon-btn"
              onClick={() => handleShare("instagram")}
              title="Share on Instagram"
            >
              <Instagram className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="taste-share-icon-btn"
              onClick={() => handleShare("whatsapp")}
              title="Share on WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="taste-share-icon-btn"
              onClick={() => handleShare("copy")}
              title="Copy Link"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}
