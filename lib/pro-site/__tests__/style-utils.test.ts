import { buildProSiteCssVars } from '../style-utils'

describe('buildProSiteCssVars', () => {
  it('sets square radius to 0px', () => {
    const vars = buildProSiteCssVars('square', 'light', null)
    expect(vars['--pro-radius']).toBe('0px')
  })

  it('sets half-rounded radius to 8px', () => {
    const vars = buildProSiteCssVars('half-rounded', 'light', null)
    expect(vars['--pro-radius']).toBe('8px')
  })

  it('sets rounded radius to 16px', () => {
    const vars = buildProSiteCssVars('rounded', 'light', null)
    expect(vars['--pro-radius']).toBe('16px')
  })

  it('dark mode sets dark surface and light text', () => {
    const vars = buildProSiteCssVars('rounded', 'dark', null)
    expect(vars['--pro-surface']).toBe('#111111')
    expect(vars['--pro-text']).toBe('#f0f0f0')
  })

  it('logo-color mode tints surface with logo hex', () => {
    const vars = buildProSiteCssVars('rounded', 'logo-color', '#009639')
    expect(vars['--pro-surface']).toBe('#00963912')
  })

  it('logo-color without logoColor falls through to light defaults', () => {
    const vars = buildProSiteCssVars('rounded', 'logo-color', null)
    expect(vars['--pro-surface']).toBe('#ffffff')
  })
})
