type RecordValue = Record<string, unknown>
export function plainText(html: string): string {
  return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]*>/g, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim()
}
export function relatedTitles(value: unknown): string[] {
  return Array.isArray(value) ? [...new Set(value.filter(item => item && typeof item === 'object')
    .map(item => String(item.title || item.display_name || item.full_name || '')).filter(Boolean))] : []
}
export function readingMinutes(content: unknown): number | undefined {
  const words: string[] = []
  function visit(node: unknown) {
    if (!node || typeof node !== 'object') return
    const n = node as RecordValue
    if (n.type === 'text' && typeof n.text === 'string') words.push(n.text)
    if (Array.isArray(n.children)) n.children.forEach(visit)
  }
  if (content && typeof content === 'object') visit((content as RecordValue).root)
  const text = words.join(' ').trim()
  return text ? Math.max(1, Math.ceil(text.split(/\s+/).length / 200)) : undefined
}
export function articleAuthor(value: unknown, reviewer: unknown): {author?: string; authorRole?: 'author' | 'reviewer'} {
  const authors = Array.isArray(value) ? value.filter(row => row.role === 'author').map(row => row.item) : []
  const names = relatedTitles(authors)
  if (names.length) return {author: names.join(', '), authorRole: 'author'}
  const reviewedBy = relatedTitles(reviewer && typeof reviewer === 'object' ? [reviewer] : [])
  return reviewedBy.length ? {author: reviewedBy[0], authorRole: 'reviewer'} : {}
}
export function facilityDescription(summary: unknown, seo: unknown, locale: 'tr' | 'en'): string {
  if (typeof summary === 'string' && summary.trim()) return plainText(summary)
  if (locale === 'tr' && typeof seo === 'string' && seo.trim()) return plainText(seo).split(/(?<=[.!?])\s/)[0]
  return ''
}
export function directionsURL(url: unknown, address: unknown, title: string): string {
  if (typeof url === 'string') {
    try {const parsed = new URL(url); if (parsed.protocol === 'https:') return parsed.href} catch {}
  }
  const destination = typeof address === 'string' && address.trim() ? address.trim() : title
  return 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(destination)
}
