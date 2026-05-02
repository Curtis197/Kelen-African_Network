export type CornerStyle = 'square' | 'half-rounded' | 'rounded'
export type ColorMode = 'light' | 'dark' | 'warm' | 'logo-color'
export type ImageWeight = 'image' | 'balanced' | 'text'
export type Spacing = 'spacious' | 'standard' | 'compact'
export type ItemType = 'service' | 'realisation' | 'produit'

export interface ProSiteItem {
  id: string
  title: string
  description: string | null
  price: string | null
  imageUrl: string | null
  likeCount: number
  commentCount: number
}

export interface ProSiteComment {
  id: string
  authorName: string
  body: string
  createdAt: string
  likeCount: number
}

export interface ProSiteSettings {
  cornerStyle: CornerStyle
  colorMode: ColorMode
  logoColor: string | null
  imageWeight: ImageWeight
  spacing: Spacing
  showServices: boolean
  showRealisations: boolean
  showProduits: boolean
  showCalendar: boolean
}
