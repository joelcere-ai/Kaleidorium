import { MetadataRoute } from 'next'
import { COLLECTOR_ARCHETYPES } from '@/lib/collector-archetypes'
import { SITE_URL } from '@/lib/seo'

const updated = new Date('2026-11-19')

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: updated, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/for-artists`, lastModified: updated, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${SITE_URL}/for-galleries`, lastModified: updated, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${SITE_URL}/about`, lastModified: updated, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/featured`, lastModified: updated, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/for-artists/register`, lastModified: updated, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/for-galleries/register`, lastModified: updated, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/register`, lastModified: updated, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/contact`, lastModified: updated, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${SITE_URL}/login`, lastModified: updated, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/terms`, lastModified: updated, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE_URL}/privacy`, lastModified: updated, changeFrequency: 'yearly', priority: 0.2 },
  ]

  const archetypes: MetadataRoute.Sitemap = COLLECTOR_ARCHETYPES.map((archetype) => ({
    url: `${SITE_URL}/share/archetype/${archetype.id}`,
    lastModified: updated,
    changeFrequency: 'yearly',
    priority: 0.4,
  }))

  return [...staticPages, ...archetypes]
}
