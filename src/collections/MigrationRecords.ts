import type { CollectionConfig } from 'payload'

export const MigrationRecords: CollectionConfig = {
  slug: 'migration-records',
  admin: { useAsTitle: 'title', group: 'Migration review' },
  access: {
    read: ({ req }) => Boolean(req.user),
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    { name: 'source_url', type: 'text', required: true, unique: true },
    { name: 'final_url', type: 'text' },
    { name: 'title', type: 'text' },
    { name: 'language', type: 'select', options: ['tr', 'en'], required: true },
    { name: 'canonical', type: 'text' },
    { name: 'body_html', type: 'textarea', maxLength: 8000000 },
    { name: 'main_html', type: 'textarea', maxLength: 8000000 },
    { name: 'source_links', type: 'json' },
    { name: 'source_images', type: 'json' },
    { name: 'translations', type: 'json' },
    { name: 'extraction', type: 'json' },
    { name: 'review_status', type: 'select', options: ['pending', 'reviewed'], defaultValue: 'pending' },
  ],
}
