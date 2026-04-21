import { buildProSiteCssVars } from '@/lib/pro-site/style-utils'
import type { CornerStyle, ColorMode } from '@/lib/pro-site/types'

export function ProSiteStyleProvider({
  cornerStyle,
  colorMode,
  logoColor,
  children,
}: {
  cornerStyle: CornerStyle
  colorMode: ColorMode
  logoColor: string | null
  children: React.ReactNode
}) {
  const vars = buildProSiteCssVars(cornerStyle, colorMode, logoColor)
  return (
    <div style={vars as React.CSSProperties} className="pro-site-root">
      {children}
    </div>
  )
}
