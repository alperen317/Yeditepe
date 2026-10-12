import {normalizeRichText} from '../src/lib/normalizeRichText'
// SQLite IDs are numbers; Payload's HTML converter initially reads them as DOM strings.
export function numericUploadIDs<T>(state: T): T {
  function visit(value: unknown) {
    if (!value || typeof value !== 'object') return
    if (Array.isArray(value)) { value.forEach(visit); return }
    const node=value as Record<string,unknown>
    if(node.type==='upload'&&node.relationTo==='media'&&typeof node.value==='string'&&/^\d+$/.test(node.value)) node.value=Number(node.value)
    Object.values(node).forEach(visit)
  }
  visit(state);return normalizeRichText(state)
}
