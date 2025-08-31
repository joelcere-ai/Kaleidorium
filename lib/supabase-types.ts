export type ArtSpendingRange = 
  | '0-999'
  | '1000-4999'
  | '5000-9999'
  | '10000-24999'
  | '25000-49999'
  | '50000-99999'
  | '100000-249999'
  | '250000-499999'
  | '500000-999999'
  | '1000000+'

export interface UserProfile {
  id: string
  email: string
  art_spending_range: ArtSpendingRange
  created_at: string
  updated_at: string
  is_temporary: boolean
  last_session: string
  profile_picture: string | null
}

export interface CollectorPreferences {
  artists: { [key: string]: number }
  genres: { [key: string]: number }
  styles: { [key: string]: number }
  subjects: { [key: string]: number }
  colors: { [key: string]: number }
  priceRanges: { [key: string]: number }
  interactionCount: number
  viewed_artworks: string[]
}

export interface Collector {
  id: string
  user_id: string
  preferences: CollectorPreferences
  created_at: string
  last_interaction: string
  is_temporary: boolean
}

export interface Collection {
  id: string
  user_id: string
  artwork_id: string
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      UserProfile: {
        Row: UserProfile
        Insert: Omit<UserProfile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<UserProfile, 'id'>>
      }
      Collectors: {
        Row: Collector
        Insert: Omit<Collector, 'created_at'>
        Update: Partial<Omit<Collector, 'id'>>
      }
      Collection: {
        Row: Collection
        Insert: Omit<Collection, 'id' | 'created_at'>
        Update: Partial<Omit<Collection, 'id'>>
      }
    }
  }
} 