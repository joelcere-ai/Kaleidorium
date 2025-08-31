import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useState } from "react"
import { Facebook, Twitter, Instagram, Link as LinkIcon, Share2, X as XIcon, MessageCircle, Copy, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { AlertDialog, AlertDialogContent } from "@/components/ui/alert-dialog"

interface ArtworkDetailsProps {
  artwork: {
    title: string
    artist: string
    medium: string
    dimensions: string
    year: string
    price: string
    description: string
    tags: string[]
    genre?: string
    style?: string
    subject?: string
    colour?: string
  }
  showShareButton?: boolean
}

export function ArtworkDetails({ artwork, showShareButton = false }: ArtworkDetailsProps) {
  const [showShare, setShowShare] = useState(false)
  const { toast } = useToast()
  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''
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
    <div className="p-6">
      <h2 className="text-2xl font-serif font-medium">{artwork.title}</h2>
      <p className="text-lg text-muted-foreground mb-4">{artwork.artist}</p>

      {artwork.price && (
        <div className="text-3xl font-medium mb-6">
          {artwork.price.toLowerCase() === 'not for sale'
            ? <span className="text-lg font-normal text-muted-foreground">Not for sale</span>
            : <span>{artwork.price}</span>
          }
        </div>
      )}

      <div className="space-y-4 mb-6">
        <div className="grid grid-cols-2 gap-2">
          <div className="text-sm text-muted-foreground">Medium</div>
          <div className="text-sm">{artwork.medium}</div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="text-sm text-muted-foreground">Dimensions</div>
          <div className="text-sm">{artwork.dimensions}</div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="text-sm text-muted-foreground">Year</div>
          <div className="text-sm">{artwork.year}</div>
        </div>
      </div>

      <Separator className="my-6" />

      <div className="mb-6">
        <h3 className="text-sm font-medium mb-2">Description</h3>
        <p className="text-sm leading-relaxed">{artwork.description}</p>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-2">Style & Subject</h3>
        <div className="flex flex-wrap gap-2">
          {allTags.length > 0 ? (
            allTags.map((tag) => (
              <Badge key={tag} variant="outline" className="font-normal">
                {tag}
              </Badge>
            ))
          ) : (
            <span className="text-muted-foreground text-sm">No tags</span>
          )}
        </div>
      </div>

      {showShareButton && (
        <>
          <div className="mt-6 flex flex-col gap-2">
            <Button variant="outline" className="w-full flex items-center gap-2" onClick={() => setShowShare(true)}>
              <Share2 className="h-5 w-5" /> Share
            </Button>
          </div>
          <AlertDialog open={showShare} onOpenChange={setShowShare}>
            <AlertDialogContent className="max-w-xs w-full rounded-lg p-6 flex flex-col gap-4 sm:max-w-md">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-lg">Share Artwork</span>
                <Button variant="ghost" size="icon" onClick={() => setShowShare(false)}><XIcon className="h-5 w-5" /></Button>
              </div>
              <div className="flex flex-col gap-3">
                <Button variant="outline" className="flex items-center gap-2" onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank', 'noopener,noreferrer')}>
                  <Facebook className="h-5 w-5 text-blue-600" /> Facebook
                </Button>
                <Button variant="outline" className="flex items-center gap-2" onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`, '_blank', 'noopener,noreferrer')}>
                  <Twitter className="h-5 w-5 text-sky-500" /> X (Twitter)
                </Button>
                <Button variant="outline" className="flex items-center gap-2" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank', 'noopener,noreferrer')}>
                  <Smartphone className="h-5 w-5 text-green-500" /> WhatsApp
                </Button>
                <Button variant="outline" className="flex items-center gap-2" onClick={() => window.open(`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}`, '_blank', 'noopener,noreferrer')}>
                  <MessageCircle className="h-5 w-5 text-green-600" /> Line
                </Button>
                <Button variant="outline" className="flex items-center gap-2" onClick={handleCopy}>
                  <Instagram className="h-5 w-5 text-pink-500" /> Instagram (Copy Link)
                </Button>
                <Button variant="outline" className="flex items-center gap-2" onClick={handleCopy}>
                  <Copy className="h-5 w-5" /> Copy Link
                </Button>
              </div>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  )
}

