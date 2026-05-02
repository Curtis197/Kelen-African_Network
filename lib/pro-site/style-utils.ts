import type { CornerStyle, ColorMode, ImageWeight, Spacing } from './types'

const RADII: Record<CornerStyle, string> = {
  square: '0px',
  'half-rounded': '8px',
  rounded: '16px',
}

const HERO_HEIGHTS: Record<ImageWeight, string> = {
  image: '90vh',
  balanced: '75vh',
  text: '55vh',
}

const SECTION_PADDINGS: Record<Spacing, string> = {
  spacious: '7rem',
  standard: '5rem',
  compact: '3rem',
}

export function buildProSiteCssVars(
  cornerStyle: CornerStyle,
  colorMode: ColorMode,
  logoColor: string | null,
  imageWeight: ImageWeight = 'balanced',
  spacing: Spacing = 'standard',
): Record<string, string> {
  const vars: Record<string, string> = {
    '--pro-radius':          RADII[cornerStyle],
    '--pro-hero-height':     HERO_HEIGHTS[imageWeight],
    '--pro-section-padding': SECTION_PADDINGS[spacing],
  }

  if (colorMode === 'dark') {
    vars['--pro-surface']     = '#111111'
    vars['--pro-surface-alt'] = '#1a1a1a'
    vars['--pro-text']        = '#f0f0f0'
    vars['--pro-text-muted']  = '#888888'
    vars['--pro-border']      = '#2a2a2a'
  } else if (colorMode === 'warm') {
    vars['--pro-surface']     = '#faf7f2'
    vars['--pro-surface-alt'] = '#f2ece2'
    vars['--pro-text']        = '#2c1f0e'
    vars['--pro-text-muted']  = '#7a5c3a'
    vars['--pro-border']      = '#e8ddd0'
  } else if (colorMode === 'logo-color' && logoColor) {
    vars['--pro-surface']     = `${logoColor}12`
    vars['--pro-surface-alt'] = `${logoColor}08`
    vars['--pro-text']        = '#1a1a2e'
    vars['--pro-text-muted']  = '#666666'
    vars['--pro-border']      = `${logoColor}25`
  } else {
    vars['--pro-surface']     = '#ffffff'
    vars['--pro-surface-alt'] = '#f5f5f5'
    vars['--pro-text']        = '#1a1a2e'
    vars['--pro-text-muted']  = '#666666'
    vars['--pro-border']      = '#eeeeee'
  }

  return vars
}
