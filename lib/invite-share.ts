export const KALEIDORIUM_SITE_URL = "https://www.kaleidorium.com"

export const KALEIDORIUM_SHARE_TEXT =
  "Discover Kaleidorium — a new art discovery engine that connects collectors and artists based on taste."

/** Full message copied or sent — write-up plus canonical site URL. */
export function buildInviteShareMessage(
  siteUrl: string = KALEIDORIUM_SITE_URL
): string {
  return `${KALEIDORIUM_SHARE_TEXT}\n\n${siteUrl}`
}

export function buildTwitterShareUrl(
  siteUrl: string = KALEIDORIUM_SITE_URL
): string {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(buildInviteShareMessage(siteUrl))}`
}

export function buildWhatsAppShareUrl(
  siteUrl: string = KALEIDORIUM_SITE_URL
): string {
  return `https://wa.me/?text=${encodeURIComponent(buildInviteShareMessage(siteUrl))}`
}

/** Facebook sharer only accepts the URL; prefilled quote is ignored by Meta. */
export function buildFacebookShareUrl(
  siteUrl: string = KALEIDORIUM_SITE_URL
): string {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(siteUrl)}`
}
