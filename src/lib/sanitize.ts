import DOMPurify from 'isomorphic-dompurify'

/** Sanitize untrusted HTML (DB-sourced) before dangerouslySetInnerHTML. */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, { USE_PROFILES: { html: true } })
}

/** Sanitize SVG markup (e.g. Mermaid output) — allows SVG, forbids scripts. */
export function sanitizeSvg(dirty: string): string {
  return DOMPurify.sanitize(dirty, { USE_PROFILES: { svg: true, svgFilters: true } })
}
