"use client"

import { Facebook, Instagram, MessageCircle, Copy } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  KALEIDORIUM_SITE_URL,
  buildInviteShareMessage,
  buildTwitterShareUrl,
  buildWhatsAppShareUrl,
} from "@/lib/invite-share"

const KaleidoriumXIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)

export function InviteArtistShare() {
  const { toast } = useToast()
  const shareMessage = buildInviteShareMessage(KALEIDORIUM_SITE_URL)

  const copyShareMessage = async (description: string) => {
    try {
      await navigator.clipboard.writeText(shareMessage)
      toast({
        title: "Copied!",
        description,
      })
      return true
    } catch {
      toast({
        title: "Could not copy",
        description: "Please copy the link manually.",
        variant: "destructive",
      })
      return false
    }
  }

  const handleCopy = () =>
    copyShareMessage("Paste it in a message to an artist you admire.")

  const handleFacebookShare = () =>
    copyShareMessage("Paste the message when you share on Facebook.")

  return (
    <div className="share-panel rounded-2xl p-6">
      <p className="share-panel-title !mb-2" style={{ fontSize: "18px" }}>
        Invite an artist you admire
      </p>
      <p
        className="text-center mx-auto mb-4"
        style={{
          fontSize: "14px",
          lineHeight: 1.55,
          color: "#5F5F5A",
          maxWidth: "420px",
        }}
      >
        Choose how you&apos;d like to share below. We&apos;ll prepare a short message about Kaleidorium
        and a link you can send to an artist you admire.
      </p>
      <div
        className="mx-auto mb-5 rounded-xl border border-[#E6E4DF] bg-[#FAFAF8] px-4 py-3 text-left"
        style={{ maxWidth: "420px" }}
      >
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8A8A84] mb-2">
          What you&apos;ll share
        </p>
        <p className="text-[13px] leading-relaxed text-[#5F5F5A] whitespace-pre-line">
          {shareMessage}
        </p>
      </div>
      <p className="share-panel-title">Share Kaleidorium</p>
      <div className="flex justify-center gap-2 flex-wrap">
        <button
          className="share-icon-btn"
          title="Share on X"
          type="button"
          onClick={() =>
            window.open(buildTwitterShareUrl(KALEIDORIUM_SITE_URL), "_blank", "noopener,noreferrer")
          }
        >
          <KaleidoriumXIcon className="w-[13px] h-[13px]" />
        </button>
        <button
          className="share-icon-btn"
          title="Share on Facebook"
          type="button"
          onClick={handleFacebookShare}
        >
          <Facebook />
        </button>
        <button
          className="share-icon-btn"
          title="Share on Instagram (copy link)"
          type="button"
          onClick={() => copyShareMessage("Paste it in your Instagram story or post.")}
        >
          <Instagram />
        </button>
        <button
          className="share-icon-btn"
          title="Share on WhatsApp"
          type="button"
          onClick={() =>
            window.open(buildWhatsAppShareUrl(KALEIDORIUM_SITE_URL), "_blank", "noopener,noreferrer")
          }
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
