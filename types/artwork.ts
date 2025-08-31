export interface Artwork {
  id: string
  title: string
  artist: string
  medium: string
  dimensions: string
  year: string
  price: string
  description: string
  tags: string[]
  artwork_image: string
  created_at: string
  updated_at: string
  link?: string
  // New fields for recommendation system
  style?: string
  genre?: string
  subject?: string
  colour?: string
}

export type ArtworkCollection = Artwork[] 