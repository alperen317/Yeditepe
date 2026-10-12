import type { CollectionConfig, AccessResult } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: ({ req }): AccessResult => req.user ? true : { or: [{ source_sha256: { exists: true } }, { is_public: { equals: true } }] },
  },
  fields: [
    { name: 'is_public', type: 'checkbox', defaultValue: false, label: 'Web sitesinde herkese açık' },
    { name: 'source_sha256', type: 'text', unique: true, index: true },
    { name: 'source_urls', type: 'json' },
    {
      name: 'alt',
      type: 'text',
      localized: true,
    },
  ],
  upload: { staticDir: 'media' },
}
