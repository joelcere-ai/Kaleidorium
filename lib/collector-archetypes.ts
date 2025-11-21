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
  // Enhanced to properly analyze artwork characteristics and recommend appropriate archetypes
  // Now includes variation to ensure different profiles can appear for similar collections
  
  if (artworks.length === 0) {
    // Return a random archetype for empty collections to add variation
    return COLLECTOR_ARCHETYPES[Math.floor(Math.random() * COLLECTOR_ARCHETYPES.length)]
  }
  
  // Analyze artwork characteristics
  const styles = artworks.map(a => (a.style || '').toLowerCase()).filter(Boolean)
  const subjects = artworks.map(a => (a.subject || '').toLowerCase()).filter(Boolean)
  const genres = artworks.map(a => (a.genre || '').toLowerCase()).filter(Boolean)
  const tags = artworks.flatMap(a => (a.tags || []).map((tag: string) => tag.toLowerCase()))
  const artists = artworks.map(a => (a.artist || '').toLowerCase()).filter(Boolean)
  
  // Check for historical/classical indicators
  const historicalKeywords = ['historical', 'history', 'classic', 'classical', 'traditional', 'vintage', 'antique', 'period', 'century', 'renaissance', 'baroque', 'impressionist', 'impressionism']
  const landscapeKeywords = ['landscape', 'nature', 'natural', 'outdoor', 'countryside', 'forest', 'mountain', 'sea', 'ocean', 'field', 'garden', 'scenery']
  const intellectualKeywords = ['realism', 'realistic', 'figurative', 'portrait', 'academic', 'museum', 'master', 'great', 'famous']
  
  // Check for digital/futuristic/contemporary indicators
  const digitalKeywords = ['digital', 'nft', 'crypto', 'blockchain', 'generative', 'algorithmic', 'code', 'programming', 'software', 'virtual', 'cyber', 'tech']
  const futuristicKeywords = ['futuristic', 'future', 'futurism', 'sci-fi', 'science fiction', 'space', 'robot', 'ai', 'artificial intelligence', 'cybernetic', 'techno', 'neon', 'glitch', 'holographic']
  const contemporaryKeywords = ['contemporary', 'modern', 'postmodern', 'avant-garde', 'experimental', 'conceptual', 'innovative', 'cutting-edge', 'emerging', 'new media', 'interactive', 'multimedia']
  const emergingKeywords = ['emerging', 'new', 'young', 'artist', 'underground', 'alternative', 'subversive', 'pioneering', 'breakthrough']
  
  // Check for minimalism/essence indicators (The Essence Enthusiast)
  const minimalismKeywords = ['minimalism', 'minimal', 'minimalist', 'clean', 'pure', 'simple', 'abstract', 'geometric', 'basic', 'fundamental', 'essential', 'reduced', 'spare', 'restraint']
  
  // Check for financial/investment indicators (Financial archetypes)
  // Note: This would typically require price/value data we don't have, so we'll use stylistic indicators
  const investmentKeywords = ['prestigious', 'masterpiece', 'established', 'collectible', 'limited', 'exclusive', 'museum', 'gallery', 'blue chip']
  
  // Count matches for different characteristics
  const historicalMatches = [...styles, ...subjects, ...tags, ...artists].filter(item => 
    historicalKeywords.some(keyword => item.includes(keyword))
  ).length
  
  const landscapeMatches = [...subjects, ...tags].filter(item => 
    landscapeKeywords.some(keyword => item.includes(keyword))
  ).length
  
  const intellectualMatches = [...styles, ...tags, ...artists].filter(item => 
    intellectualKeywords.some(keyword => item.includes(keyword))
  ).length
  
  // Count digital/futuristic/contemporary matches
  const digitalMatches = [...styles, ...subjects, ...tags, ...genres].filter(item => 
    digitalKeywords.some(keyword => item.includes(keyword))
  ).length
  
  const futuristicMatches = [...styles, ...subjects, ...tags].filter(item => 
    futuristicKeywords.some(keyword => item.includes(keyword))
  ).length
  
  const contemporaryMatches = [...styles, ...tags, ...artists].filter(item => 
    contemporaryKeywords.some(keyword => item.includes(keyword))
  ).length
  
  const emergingMatches = [...tags, ...artists].filter(item => 
    emergingKeywords.some(keyword => item.includes(keyword))
  ).length
  
  // Count minimalism/essence matches
  const minimalismMatches = [...styles, ...tags].filter(item => 
    minimalismKeywords.some(keyword => item.includes(keyword))
  ).length
  
  // Count investment/prestigious matches
  const investmentMatches = [...styles, ...tags, ...artists].filter(item => 
    investmentKeywords.some(keyword => item.includes(keyword))
  ).length
  
  // Check for specific historical artists (common in collections with historical focus)
  const historicalArtistNames = ['van gogh', 'monet', 'renoir', 'degas', 'cezanne', 'gauguin', 'toulouse', 'lautrec', 'pissarro', 'manet', 'vermeer', 'rembrandt', 'david', 'ingres', 'delacroix', 'turner', 'constable']
  const hasHistoricalArtists = artists.some(artist => 
    historicalArtistNames.some(name => artist.includes(name))
  )
  
  // Check for traditional mediums that suggest classical/artistic focus
  const traditionalMediums = ['oil', 'watercolor', 'tempera', 'acrylic', 'canvas', 'paper']
  const hasTraditionalMediums = genres.some(genre => 
    traditionalMediums.some(medium => genre.includes(medium))
  )
  
  // Check for digital/contemporary mediums
  const digitalMediums = ['digital', 'nft', 'gif', 'video', 'animation', '3d', 'vr', 'ar', 'mixed media']
  const hasDigitalMediums = genres.some(genre => 
    digitalMediums.some(medium => genre.includes(medium))
  )
  
  const totalArtworks = artworks.length
  const uniqueArtists = new Set(artworks.map(a => a.artist)).size
  const diversityRatio = uniqueArtists / totalArtworks
  
  // Determine archetype based on collection characteristics
  const totalHistoricalScore = historicalMatches + (hasHistoricalArtists ? 2 : 0) + (hasTraditionalMediums ? 1 : 0)
  const totalLandscapeScore = landscapeMatches
  const totalIntellectualScore = intellectualMatches
  const totalDigitalScore = digitalMatches + (hasDigitalMediums ? 2 : 0)
  const totalFuturisticScore = futuristicMatches + contemporaryMatches
  const totalEmergingScore = emergingMatches
  const totalMinimalismScore = minimalismMatches
  const totalInvestmentScore = investmentMatches
  
  // Prioritize archetypes based on collection analysis
  
  // 1. FIRST PRIORITY: Check for historical/classical collections
  if (totalHistoricalScore > 0 || totalLandscapeScore > totalArtworks * 0.4 || totalIntellectualScore > 0) {
    // This suggests a collection focused on historical, landscape, or classical art
    
    if (totalHistoricalScore > totalArtworks * 0.6) {
      // Strong historical focus - likely a scholar or custodian
      if (diversityRatio < 0.5) {
        // Focused on specific historical periods/artists
        return COLLECTOR_ARCHETYPES.find(a => a.id === 'arbiter-of-aesthetics') || COLLECTOR_ARCHETYPES[0]
      } else {
        // Broader historical appreciation
        return COLLECTOR_ARCHETYPES.find(a => a.id === 'custodian-of-continuance') || COLLECTOR_ARCHETYPES[0]
      }
    } else if (totalLandscapeScore > totalArtworks * 0.4) {
      // Strong landscape/nature focus - likely intellectual collector
      return COLLECTOR_ARCHETYPES.find(a => a.id === 'arbiter-of-aesthetics') || COLLECTOR_ARCHETYPES[0]
    } else if (totalIntellectualScore > 0) {
      // Intellectual/realistic focus
      return COLLECTOR_ARCHETYPES.find(a => a.id === 'arbiter-of-aesthetics') || COLLECTOR_ARCHETYPES[0]
    } else {
      // Mixed historical/classical elements
      return COLLECTOR_ARCHETYPES.find(a => a.id === 'custodian-of-continuance') || COLLECTOR_ARCHETYPES[0]
    }
  }
  
  // 2. SECOND PRIORITY: Check for investment/prestige-focused collections (Financial archetypes)
  if (totalInvestmentScore > totalArtworks * 0.3) {
    // Investment/prestige focus - determine if acquisitor or valuator
    if (totalHistoricalScore > totalArtworks * 0.4) {
      // Mix of investment and historical prestige - likely acquisitor of esteem
      return COLLECTOR_ARCHETYPES.find(a => a.id === 'acquisitor-of-esteem') || COLLECTOR_ARCHETYPES[0]
    } else {
      // Pure investment focus - likely valuator virtuoso
      return COLLECTOR_ARCHETYPES.find(a => a.id === 'valuator-virtuoso') || COLLECTOR_ARCHETYPES[0]
    }
  }
  
  // 3. THIRD PRIORITY: Check for digital/futuristic/contemporary collections
  if (totalDigitalScore > 0 || totalFuturisticScore > totalArtworks * 0.3 || hasDigitalMediums) {
    // This suggests a collection focused on digital, futuristic, or cutting-edge art
    
    if (totalEmergingScore > 0 || totalFuturisticScore > totalArtworks * 0.4) {
      // Strong emerging/futuristic focus - pioneer/visionary collector
      if (totalDigitalScore > totalArtworks * 0.5) {
        // Primarily digital/tech-focused
        return COLLECTOR_ARCHETYPES.find(a => a.id === 'architect-of-tomorrow') || COLLECTOR_ARCHETYPES[0]
      } else {
        // Mixed futuristic/experimental focus
        return COLLECTOR_ARCHETYPES.find(a => a.id === 'vanguard-visionary') || COLLECTOR_ARCHETYPES[0]
      }
    } else if (totalDigitalScore > totalArtworks * 0.4) {
      // Strong digital focus but not necessarily emerging artists
      if (diversityRatio > 0.6) {
        // Diverse digital collection - exploring new territories
        return COLLECTOR_ARCHETYPES.find(a => a.id === 'horizon-seeker') || COLLECTOR_ARCHETYPES[0]
      } else {
        // Focused digital collector - architect of tomorrow
        return COLLECTOR_ARCHETYPES.find(a => a.id === 'architect-of-tomorrow') || COLLECTOR_ARCHETYPES[0]
      }
    } else {
      // Some digital/futuristic elements
      return COLLECTOR_ARCHETYPES.find(a => a.id === 'vanguard-visionary') || COLLECTOR_ARCHETYPES[0]
    }
  }
  
  // 4. FOURTH PRIORITY: Check for minimalism/essence-focused collections (The Essence Enthusiast)
  if (totalMinimalismScore > totalArtworks * 0.4) {
    // Strong minimalism focus - essence enthusiast
    return COLLECTOR_ARCHETYPES.find(a => a.id === 'essence-enthusiast') || COLLECTOR_ARCHETYPES[0]
  }
  
  // 5. FIFTH PRIORITY: Check for benevolent patron (collections focused on supporting artists)
  if (totalEmergingScore > totalArtworks * 0.6 && diversityRatio > 0.7) {
    // High emerging artist diversity suggests supportive collector - benevolent patron
    return COLLECTOR_ARCHETYPES.find(a => a.id === 'benevolent-patron') || COLLECTOR_ARCHETYPES[0]
  }
  
  // 6. SIXTH PRIORITY: Fall back to diversity-based analysis for contemporary/modern collections
  // Calculate scores for multiple candidate archetypes to add variation
  const candidateArchetypes: { archetype: CollectorArchetype; score: number }[] = []
  
  if (diversityRatio < 0.3) {
    // Low diversity - likely focused collector
    candidateArchetypes.push({ 
      archetype: COLLECTOR_ARCHETYPES.find(a => a.id === 'zealous-devotee') || COLLECTOR_ARCHETYPES[0],
      score: 0.8
    })
    candidateArchetypes.push({ 
      archetype: COLLECTOR_ARCHETYPES.find(a => a.id === 'instinctive-curator') || COLLECTOR_ARCHETYPES[0],
      score: 0.5
    })
  } else if (diversityRatio > 0.8) {
    // High diversity - likely exploratory collector
    candidateArchetypes.push({ 
      archetype: COLLECTOR_ARCHETYPES.find(a => a.id === 'horizon-seeker') || COLLECTOR_ARCHETYPES[0],
      score: 0.9
    })
    candidateArchetypes.push({ 
      archetype: COLLECTOR_ARCHETYPES.find(a => a.id === 'benevolent-patron') || COLLECTOR_ARCHETYPES[0],
      score: 0.6
    })
    candidateArchetypes.push({ 
      archetype: COLLECTOR_ARCHETYPES.find(a => a.id === 'vanguard-visionary') || COLLECTOR_ARCHETYPES[0],
      score: 0.4
    })
  } else {
    // Medium diversity - multiple possibilities
    candidateArchetypes.push({ 
      archetype: COLLECTOR_ARCHETYPES.find(a => a.id === 'instinctive-curator') || COLLECTOR_ARCHETYPES[0],
      score: 0.7
    })
    candidateArchetypes.push({ 
      archetype: COLLECTOR_ARCHETYPES.find(a => a.id === 'horizon-seeker') || COLLECTOR_ARCHETYPES[0],
      score: 0.5
    })
    candidateArchetypes.push({ 
      archetype: COLLECTOR_ARCHETYPES.find(a => a.id === 'benevolent-patron') || COLLECTOR_ARCHETYPES[0],
      score: 0.4
    })
  }
  
  // Add some variation based on collection size and composition
  // Use collection hash to add deterministic but varied selection
  const collectionHash = artworks.length + uniqueArtists + totalArtworks % 10
  const variationFactor = collectionHash % 3
  
  // Select from top candidates with weighted randomness
  if (candidateArchetypes.length > 0) {
    // Sort by score and take top 2-3
    candidateArchetypes.sort((a, b) => b.score - a.score)
    const topCandidates = candidateArchetypes.slice(0, Math.min(3, candidateArchetypes.length))
    
    // Use variation factor to select from top candidates
    const selectedIndex = variationFactor % topCandidates.length
    return topCandidates[selectedIndex].archetype
  }
  
  // Final fallback
  return COLLECTOR_ARCHETYPES.find(a => a.id === 'instinctive-curator') || COLLECTOR_ARCHETYPES[0]
}
