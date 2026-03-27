import { useState } from "react"
import { Facebook, Twitter, Instagram, Link as LinkIcon, Share2, X as XIcon, MessageCircle, Copy, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { AlertDialog, AlertDialogContent } from "@/components/ui/alert-dialog"

interface ArtworkDetailsProps {
  artwork: {
    id?: string
    title: string
    artist: string
    medium: string
    dimensions: string
    year: string
    price: string
    currency?: string
    description: string
    tags: string[]
    genre?: string
    style?: string
    subject?: string
    colour?: string
    link?: string
  }
  showShareButton?: boolean
}

export function ArtworkDetails({ artwork, showShareButton = false }: ArtworkDetailsProps) {
  const [showShare, setShowShare] = useState(false)
  const { toast } = useToast()
  // Generate share URL with artwork ID if available
  const getShareUrl = () => {
    if (typeof window === 'undefined') return 'https://kaleidorium.com'
    const baseUrl = window.location.origin
    const urlParams = new URLSearchParams(window.location.search)
    const artworkId = urlParams.get('artworkId') || artwork.id
    return artworkId ? `${baseUrl}/?artworkId=${artworkId}` : baseUrl
  }
  const shareUrl = getShareUrl()
  const shareText = `Check out this artwork: ${artwork.title} by ${artwork.artist}`

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl)
    toast({ title: "Link copied!", description: "You can now share it anywhere." })
  }

  // Collect all tags: genre, style, subject, colour, plus any in tags[]
  const allTags = [
    artwork.genre,
    artwork.style,
    artwork.subject,
    artwork.colour,
    ...(artwork.tags || [])
  ].filter(
    (tag, idx, arr) => tag && arr.indexOf(tag) === idx // remove falsy and duplicates
  );

  return (
    <div className="p-6 space-y-8">
      {/* About this artwork */}
      <div className="space-y-4">
        <h3 className="artwork-section-title">About this artwork</h3>
        <p className="artwork-description">{artwork.description}</p>
        {/* Metadata row */}
        <div className="flex flex-wrap items-center gap-4 artwork-meta mt-6">
          {artwork.year && <span>{artwork.year}</span>}
          {artwork.medium && <span>{artwork.medium}</span>}
          {artwork.dimensions && <span>{artwork.dimensions}</span>}
          {artwork.price && (
            <span>
              {artwork.price.toLowerCase() === 'sold' || artwork.price.toLowerCase() === 'enquire' || artwork.price.toLowerCase() === 'not for sale'
                ? artwork.price
                : artwork.currency
                  ? `${artwork.price} ${artwork.currency}`
                  : artwork.price
              }
            </span>
          )}
        </div>
      </div>

      {/* Style & Subject */}
      <div className="space-y-3">
        <h3 className="artwork-section-title">Style & Subject</h3>
        <div className="flex flex-wrap gap-2 mt-4">
          {allTags.length > 0 ? (
            allTags.map((tag) => (
              <span key={tag} className="artwork-chip">{tag}</span>
            ))
          ) : (
            <span className="text-muted-foreground text-sm italic">No tags available</span>
          )}
        </div>
      </div>

      {/* View on Artist Website Button */}
      {artwork.link && artwork.link.trim() !== '' && (
        <div>
          <button
            className="artwork-cta-btn"
            onClick={() => {
              try {
                let url = artwork.link!.trim();
                if (!url.startsWith('http://') && !url.startsWith('https://')) {
                  url = 'https://' + url;
                }
                window.open(url, '_blank', 'noopener,noreferrer');
              } catch (error) {
                console.error('Invalid artist URL:', artwork.link);
              }
            }}
          >
            View on artist's website
          </button>
        </div>
      )}

      {showShareButton && (
        <>
          {/* Share section — lower visual priority */}
          <div className="py-4 px-5 bg-[#FAFAF8] rounded-xl border border-[#E6E4DF]">
            <p className="artwork-meta text-center mb-3">Share this artwork</p>
            <div className="flex justify-center gap-2">
              <button className="share-icon-btn" title="Share on X"
                onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`, '_blank', 'noopener,noreferrer')}>
                <XIcon />
              </button>
              <button className="share-icon-btn" title="Share on Facebook"
                onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank', 'noopener,noreferrer')}>
                <Facebook />
              </button>
              <button className="share-icon-btn" title="Share on WhatsApp"
                onClick={() => {
                  const whatsappText = `${shareText}\n\n${shareUrl}`
                  window.open(`https://wa.me/?text=${encodeURIComponent(whatsappText)}`, '_blank', 'noopener,noreferrer')
                }}>
                <Smartphone />
              </button>
              <button className="share-icon-btn" title="Share on Line"
                onClick={() => window.open(`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}`, '_blank', 'noopener,noreferrer')}>
                <MessageCircle />
              </button>
              <button className="share-icon-btn" title="Copy Link" onClick={handleCopy}>
                <Copy />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
