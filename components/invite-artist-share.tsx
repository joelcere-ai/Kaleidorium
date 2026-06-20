"use client"

import { Facebook, Instagram, MessageCircle, Copy } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const KaleidoriumXIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)

const KALEIDORIUM_SITE_URL = "https://www.kaleidorium.com"
const KALEIDORIUM_SHARE_TEXT =
  "Discover Kaleidorium — a new art discovery engine that connects collectors and artists based on taste."

export function InviteArtistShare() {
  const { toast } = useToast()
  const shareUrl = KALEIDORIUM_SITE_URL

  const handleCopy = async () => {
    const text = `${KALEIDORIUM_SHARE_TEXT}\n\n${shareUrl}`
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Link copied!",
        description: "Paste it in a message to an artist you admire.",
      })
    } catch {
      toast({
        title: "Could not copy",
        description: "Please copy the link manually.",
        variant: "destructive",
      })
    }
  }

  return (
    <div
      className="bg-[#FAFAF8] rounded-2xl border border-[#E6E4DF] p-6"
      style={{ boxShadow: "0 1px 4px rgba(20,20,20,0.04)" }}
    >
      <h3
        style={{
          fontSize: "18px",
          fontWeight: 700,
          color: "#1E1E1C",
          textAlign: "center",
          marginBottom: "8px",
        }}
      >
        Invite an artist you admire
      </h3>
      <p
        style={{
          fontSize: "14px",
          lineHeight: 1.55,
          color: "#5F5F5A",
          textAlign: "center",
          maxWidth: "420px",
          margin: "0 auto 20px",
        }}
      >
        {KALEIDORIUM_SHARE_TEXT}
      </p>
      <p className="artwork-meta text-center mb-3">Share Kaleidorium</p>
      <div className="flex justify-center gap-2 flex-wrap">
        <button
          className="share-icon-btn"
          title="Share on X"
          type="button"
          onClick={() =>
            window.open(
              `https://twitter.com/intent/tweet?text=${encodeURIComponent(KALEIDORIUM_SHARE_TEXT)}&url=${encodeURIComponent(shareUrl)}`,
              "_blank",
              "noopener,noreferrer"
            )
          }
        >
          <KaleidoriumXIcon className="w-[13px] h-[13px]" />
        </button>
        <button
          className="share-icon-btn"
          title="Share on Facebook"
          type="button"
          onClick={() =>
            window.open(
              `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(KALEIDORIUM_SHARE_TEXT)}`,
              "_blank",
              "noopener,noreferrer"
            )
          }
        >
          <Facebook />
        </button>
        <button
          className="share-icon-btn"
          title="Share on Instagram (copy link)"
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(`${KALEIDORIUM_SHARE_TEXT}\n\n${shareUrl}`)
              toast({
                title: "Link copied!",
                description: "Paste it in your Instagram story or post.",
              })
            } catch {
              handleCopy()
            }
          }}
        >
          <Instagram />
        </button>
        <button
          className="share-icon-btn"
          title="Share on WhatsApp"
          type="button"
          onClick={() => {
            const whatsappText = `${KALEIDORIUM_SHARE_TEXT}\n\n${shareUrl}`
            window.open(
              `https://wa.me/?text=${encodeURIComponent(whatsappText)}`,
              "_blank",
              "noopener,noreferrer"
            )
          }}
        >
          <MessageCircle />
        </button>
        <button className="share-icon-btn" title="Copy link" type="button" onClick={handleCopy}>
          <Copy />
        </button>
      </div>
    </div>
  )
}
