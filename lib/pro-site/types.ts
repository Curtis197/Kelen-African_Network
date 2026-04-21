export type CornerStyle = 'square' | 'half-rounded' | 'rounded'
export type ColorMode = 'light' | 'dark' | 'logo-color'
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
  showServices: boolean
  showRealisations: boolean
  showProduits: boolean
  showCalendar: boolean
}
