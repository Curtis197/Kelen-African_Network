import type { CornerStyle, ColorMode } from './types'

const RADII: Record<CornerStyle, string> = {
  square: '0px',
  'half-rounded': '8px',
  rounded: '16px',
}

export function buildProSiteCssVars(
  cornerStyle: CornerStyle,
  colorMode: ColorMode,
  logoColor: string | null,
): Record<string, string> {
  const vars: Record<string, string> = {
    '--pro-radius': RADII[cornerStyle],
  }

  if (colorMode === 'dark') {
    vars['--pro-surface']     = '#111111'
    vars['--pro-surface-alt'] = '#1a1a1a'
    vars['--pro-text']        = '#f0f0f0'
    vars['--pro-text-muted']  = '#888888'
    vars['--pro-border']      = '#2a2a2a'
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
