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
    <div className="p-6 space-y-4">
      {/* Enhanced Typography Hierarchy */}
      <div className="space-y-2">
        <h1 className="text-xl font-serif font-bold leading-tight tracking-tight">{artwork.title}</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm tracking-wider text-muted-foreground font-medium">by</span>
          <p className="text-lg font-serif font-medium text-foreground">{artwork.artist}</p>
        </div>
      </div>

      {/* Enhanced Price Display */}
      {artwork.price && (
        <div className="py-4 px-6 bg-gray-50 rounded-xl border">
          {artwork.price.toLowerCase() === 'not for sale'
            ? <div className="text-center">
                <span className="text-lg font-medium text-muted-foreground">Not for sale</span>
              </div>
            : <div className="text-center">
                <span className="text-3xl font-bold text-foreground">{artwork.price}</span>
              </div>
          }
        </div>
      )}

      {/* Enhanced Description - Moved higher */}
      <div className="space-y-3">
        <h3 className="text-lg font-serif font-semibold text-foreground">About this artwork</h3>
        <p className="text-base leading-relaxed text-muted-foreground font-normal">{artwork.description}</p>
      </div>

      {/* Enhanced Metadata Grid - More compact */}
      <div className="space-y-3">
        <div className="grid gap-2">
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm tracking-wider text-muted-foreground font-semibold">Medium</span>
            <span className="text-base font-medium text-foreground">{artwork.medium}</span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm tracking-wider text-muted-foreground font-semibold">Dimensions</span>
            <span className="text-base font-medium text-foreground">{artwork.dimensions}</span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm tracking-wider text-muted-foreground font-semibold">Year</span>
            <span className="text-base font-medium text-foreground">{artwork.year}</span>
          </div>
        </div>
      </div>

      <Separator className="my-6" />

      {/* Enhanced Tags */}
      <div className="space-y-4">
        <h3 className="text-lg font-serif font-semibold text-foreground">Style & Subject</h3>
        <div className="flex flex-wrap gap-3">
          {allTags.length > 0 ? (
            allTags.map((tag) => (
              <Badge 
                key={tag} 
                variant="outline" 
                className="px-3 py-1 text-sm font-medium border-gray-300 hover:bg-gray-50 transition-colors duration-200"
              >
                {tag}
              </Badge>
            ))
          ) : (
            <span className="text-muted-foreground text-sm italic">No tags available</span>
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

