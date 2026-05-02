import { buildProSiteCssVars } from '@/lib/pro-site/style-utils'
import type { CornerStyle, ColorMode, ImageWeight, Spacing } from '@/lib/pro-site/types'

export function ProSiteStyleProvider({
  cornerStyle,
  colorMode,
  logoColor,
  imageWeight = 'balanced',
  spacing = 'standard',
  children,
}: {
  cornerStyle: CornerStyle
  colorMode: ColorMode
  logoColor: string | null
  imageWeight?: ImageWeight
  spacing?: Spacing
  children: React.ReactNode
}) {
  const vars = buildProSiteCssVars(cornerStyle, colorMode, logoColor, imageWeight, spacing)
  return (
    <div style={vars as React.CSSProperties} className="pro-site-root">
      {children}
    </div>
  )
}
