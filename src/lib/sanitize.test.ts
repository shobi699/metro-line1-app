import { describe, it, expect } from 'vitest'
import { sanitizeHtml, sanitizeSvg } from './sanitize'

describe('sanitize helper', () => {
  it('strips script tags and preserves basic formatting HTML', () => {
    const dirty = '<b>ok</b><script>alert(1)</script>'
    const clean = sanitizeHtml(dirty)
    expect(clean).toBe('<b>ok</b>')
  })

  it('strips onerror and other script attributes from images', () => {
    const dirty = '<img src="x" onerror="alert(1)">'
    const clean = sanitizeHtml(dirty)
    expect(clean).toBe('<img src="x">')
  })

  it('strips script elements from SVG markup', () => {
    const dirty = '<svg><rect width="100" height="100" /><script>alert(1)</script></svg>'
    const clean = sanitizeSvg(dirty)
    expect(clean).toContain('<svg>')
    expect(clean).toContain('<rect')
    expect(clean).not.toContain('<script>')
  })

  it('preserves foreignObject and inner HTML tags inside SVG', () => {
    const dirty = '<svg><rect /><foreignObject width="100" height="100"><div xmlns="http://www.w3.org/1999/xhtml">test text</div></foreignObject></svg>'
    const clean = sanitizeSvg(dirty)
    expect(clean).toContain('<foreignObject')
    expect(clean).toContain('<div')
    expect(clean).toContain('test text')
  })
})
