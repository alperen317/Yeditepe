import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import {previewCollections,previewURL} from './lib/previewURLs'
import { Homepage } from './collections/Homepage'
import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Content } from './collections/Content'
import { MigrationRecords } from './collections/MigrationRecords'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    components:{
      providers:['/components/admin/PreviewFocusProvider#PreviewFocusProvider'],
      graphics:{Logo:'/components/admin/AdminBrand#AdminLogo',Icon:'/components/admin/AdminBrand#AdminIcon'},
    },
    livePreview: {
      collections: [...previewCollections],globals:['homepage'],
      url:({data,locale,collectionConfig,globalConfig})=>previewURL(data,locale?.code||'tr',collectionConfig?.slug||globalConfig?.slug||''),
      breakpoints:[{label:'Mobil',name:'mobile',width:390,height:844},{label:'Tablet',name:'tablet',width:768,height:1024},{label:'Masaüstü',name:'desktop',width:1440,height:900}],
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  globals: [Homepage],
  collections: [Users, Media, ...Content, MigrationRecords],
  localization: { locales: ['tr', 'en'], defaultLocale: 'tr', fallback: false },
  telemetry: false,
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: sqliteAdapter({
    client: {
      url: process.env.DATABASE_URL || '',
    },
  }),
  sharp,
  plugins: [],
})
