export interface CollectorArchetype {
  id: string
  name: string
  description: string
  imagePath: string
  category: 'intellectual' | 'financial' | 'passion'
}

export const COLLECTOR_ARCHETYPES: CollectorArchetype[] = [
  // Intellectual and Historical Archetypes
  {
    id: 'arbiter-of-aesthetics',
    name: 'The Arbiter of Aesthetics',
    description: 'You are a highly intellectual collector motivated by the history, subtlety, and attribution of artworks. You are often independent and unaffected by passing trends, focusing on pieces that resonate with enduring significance.',
    imagePath: '/collector-archetypes/The Arbiter of Aesthetics.png',
    category: 'intellectual'
  },
  {
    id: 'custodian-of-continuance',
    name: 'The Custodian of Continuance',
    description: 'You focus on building a collection with long-term cultural, historical, or financial value for future generations. Your aim is to preserve significant artistic legacies, ensuring their impact transcends your lifetime.',
    imagePath: '/collector-archetypes/The Custodian of Continuance.png',
    category: 'intellectual'
  },
  {
    id: 'essence-enthusiast',
    name: 'The Essence Enthusiast',
    description: 'You possess a refined eye for purity and a deep appreciation for the fundamental elements of art. Your collecting philosophy centers on pieces that convey profound meaning through restraint, clean lines, and a masterful command of form and space.',
    imagePath: '/collector-archetypes/The Essence Enthusiast.png',
    category: 'intellectual'
  },
  
  // Financial and Status-Driven Archetypes
  {
    id: 'acquisitor-of-esteem',
    name: 'The Acquisitor of Esteem',
    description: 'You are primarily motivated by financial gain and the social status associated with owning valuable art. You are often wealthy enough to operate independently, sometimes ignoring the established social infrastructure of the art world.',
    imagePath: '/collector-archetypes/The Acquisitor of Esteem.png',
    category: 'financial'
  },
  {
    id: 'valuator-virtuoso',
    name: 'The Valuator Virtuoso',
    description: 'You view art as a financial asset and a shrewd form of investment, meticulously focusing on pieces that are likely to appreciate significantly in value. Your decisions are driven by market analysis and future projections rather than purely aesthetic appeal.',
    imagePath: '/collector-archetypes/The Valuator Virtuoso.png',
    category: 'financial'
  },
  
  // Passion and Instinct-Based Archetypes
  {
    id: 'instinctive-curator',
    name: 'The Instinctive Curator',
    description: 'You are driven by a gut instinct and a powerful emotional connection to a piece of art, often collecting in the moment without the need for deep intellectual analysis. Your choices are deeply personal, reflecting an immediate, heartfelt response to beauty and expression.',
    imagePath: '/collector-archetypes/The Instinctive Curator.png',
    category: 'passion'
  },
  
  // Additional archetypes (based on the uploaded images)
  {
    id: 'architect-of-tomorrow',
    name: 'The Architect of Tomorrow',
    description: 'You are a forward-thinking collector who seeks to shape the future of art through your acquisitions. You focus on emerging artists and innovative techniques, building a collection that represents the cutting edge of contemporary expression.',
    imagePath: '/collector-archetypes/The Architect of Tomorrow.png',
    category: 'intellectual'
  },
  {
    id: 'benevolent-patron',
    name: 'The Benevolent Patron',
    description: 'You are motivated by supporting artists and the broader art community. Your collecting is driven by a desire to nurture talent and contribute to the cultural ecosystem, often focusing on emerging artists and underrepresented voices.',
    imagePath: '/collector-archetypes/The Benevolent Patron.png',
    category: 'passion'
  },
  {
    id: 'horizon-seeker',
    name: 'The Horizon Seeker',
    description: 'You are constantly exploring new artistic territories and seeking fresh perspectives. Your collection reflects a restless curiosity and an openness to diverse styles, cultures, and artistic movements from around the world.',
    imagePath: '/collector-archetypes/The Horizon Seeker.png',
    category: 'passion'
  },
  {
    id: 'vanguard-visionary',
    name: 'The Vanguard Visionary',
    description: 'You are at the forefront of artistic discovery, always seeking the next breakthrough in art. Your collection showcases pioneering works and experimental pieces that challenge conventional boundaries and push artistic expression forward.',
    imagePath: '/collector-archetypes/The Vanguard Visionary.png',
    category: 'intellectual'
  },
  {
    id: 'zealous-devotee',
    name: 'The Zealous Devotee',
    description: 'You are deeply passionate about specific artists, movements, or themes. Your collection is built around a central obsession, reflecting an intense dedication to particular aesthetic or conceptual principles.',
    imagePath: '/collector-archetypes/Tje Zealous Devotee.png',
    category: 'passion'
  }
]

export function getArchetypeById(id: string): CollectorArchetype | undefined {
  return COLLECTOR_ARCHETYPES.find(archetype => archetype.id === id)
}

export function analyzeCollectionForArchetype(artworks: any[]): CollectorArchetype {
  // AI analysis logic to determine the most fitting archetype
  // This is a simplified version - in production, you'd use actual AI analysis
  
  if (artworks.length === 0) {
    return COLLECTOR_ARCHETYPES[0] // Default to first archetype
  }
  
  // Simple heuristics based on collection characteristics
  const totalArtworks = artworks.length
  const uniqueArtists = new Set(artworks.map(a => a.artist)).size
  const diversityRatio = uniqueArtists / totalArtworks
  
  // Analyze styles, subjects, and other characteristics
  const styles = artworks.map(a => a.style || '').filter(Boolean)
  const subjects = artworks.map(a => a.subject || '').filter(Boolean)
  
  // Determine archetype based on collection patterns
  if (diversityRatio < 0.3) {
    // Low diversity - likely focused collector
    return COLLECTOR_ARCHETYPES.find(a => a.id === 'zealous-devotee') || COLLECTOR_ARCHETYPES[0]
  } else if (diversityRatio > 0.8) {
    // High diversity - likely exploratory collector
    return COLLECTOR_ARCHETYPES.find(a => a.id === 'horizon-seeker') || COLLECTOR_ARCHETYPES[0]
  } else {
    // Medium diversity - balanced approach
    return COLLECTOR_ARCHETYPES.find(a => a.id === 'instinctive-curator') || COLLECTOR_ARCHETYPES[0]
  }
}
