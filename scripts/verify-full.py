"""Read-only audit of actual SQLite records against harvested content."""
import json, sqlite3, hashlib
from pathlib import Path
from collections import Counter
root=Path('imports/full')
c=sqlite3.connect('file:payload-local.db?mode=ro',uri=True)
errors=[];expected={};localized=set();derived=set()
for line in (root/'normalized.jsonl').open():
 r=json.loads(line);expected[(r['collection'],r['source_key'])]=r;localized.add((r['collection'],r['source_key'],r['locale']))
 for d in r['derived']:derived.add((d['collection'],d['source_key']))
counts={};actual={};locales={};relationships={}
schemas=json.loads(Path('src/collections/content-schema.json').read_text())
for s in schemas:
 slug=s['slug'];t=slug.replace('-','_')
 base_cols={r[1] for r in c.execute(f'PRAGMA table_info("{t}")')}
 metadata='source_metadata' if 'source_metadata' in base_cols else 'NULL'
 key_column='source_key' if 'source_key' in base_cols else 'NULL'
 rows=c.execute(f'SELECT id,{key_column},{metadata} FROM "{t}"').fetchall()
 counts[slug]=len(rows)
 for id,key,meta in rows:actual[(slug,key)]=(id,json.loads(meta) if meta else {})
 cols=[r[1] for r in c.execute(f'PRAGMA table_info("{t}_locales")')]
 if cols:
  locales[slug]=set(c.execute(f'SELECT _parent_id,_locale FROM "{t}_locales"'))
 if c.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?",(t+'_rels',)).fetchone():
  relationships[slug]=dict(c.execute(f'SELECT path,count(*) FROM "{t}_rels" GROUP BY path'))
for key,r in expected.items():
 if key not in actual:errors.append({'missing_content':key});continue
 _,meta=actual[key]
for slug,key,locale in localized:
 a=actual.get((slug,key))
 if a and locale not in a[1].get('sources',{}):errors.append({'missing_source_locale':[slug,key,locale]})
 if a and slug in locales and (a[0],locale) not in locales[slug]:errors.append({'missing_localized_row':[slug,key,locale]})
for key in derived:
 if key not in actual:errors.append({'missing_derived':key})
sources=set()
for file in [root/'records.jsonl',Path('imports/extra/records.jsonl')]:
 for line in file.open():sources.add(json.loads(line)['source_url'])
staged={r[0] for r in c.execute('SELECT source_url FROM migration_records')}
for url in sources-staged:errors.append({'missing_snapshot':url})
asset_index=json.loads((root/'asset-index.json').read_text());wanted={v['sha256'] for v in asset_index.values()}
media=c.execute('SELECT source_sha256,filename FROM media').fetchall();hashes={r[0] for r in media}
for h in wanted-hashes:errors.append({'missing_media_hash':h})
transformed=0;stored_hashes={}
asset_by_hash={a['sha256']:a for a in asset_index.values()}
for sha,file in media:
 p=Path('media')/file
 if not p.is_file():errors.append({'missing_media_file':file})
 else:
  stored_hashes[file]=hashlib.sha256(p.read_bytes()).hexdigest()
  if stored_hashes[file]!=sha:transformed+=1
  original=asset_by_hash.get(sha)
  if original and hashlib.sha256(Path(original['path']).read_bytes()).hexdigest()!=sha:errors.append({'original_asset_hash_mismatch':file})
for table in [r[0] for r in c.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%_locales'")]:
 wrong=c.execute(f'SELECT count(*) FROM "{table}" WHERE _locale NOT IN (\'tr\',\'en\')').fetchone()[0]
 if wrong:errors.append({'unexpected_locale':table,'count':wrong})
lexical_documents=0;lexical_uploads=0
def walk(value):
 global lexical_uploads
 if isinstance(value,list):
  for v in value:walk(v)
 elif isinstance(value,dict):
  if value.get('type')=='upload' and value.get('relationTo')=='media':
   lexical_uploads+=1
   if value.get('value') not in media_ids:errors.append({'broken_lexical_upload':value.get('value')})
  for v in value.values():walk(v)
media_ids={r[0] for r in c.execute('SELECT id FROM media')}
for slug in counts:
 t=slug.replace('-','_')+'_locales'
 cols=[r[1] for r in c.execute(f'PRAGMA table_info("{t}")')]
 if 'content' in cols:
  for content, in c.execute(f'SELECT content FROM "{t}" WHERE content IS NOT NULL'):
   lexical_documents+=1;walk(json.loads(content))
foreign=list(c.execute('PRAGMA foreign_key_check'))
if foreign:errors.append({'foreign_key_violations':foreign})
report={'content_counts':counts,'expected_main_content':len(expected),'expected_localized_versions':len(localized),'expected_derived_content':len(derived),'successful_source_pages':len(sources),'staged_pages':len(staged),'media_files':len(media),'upload_transformed_files':transformed,'media_source_urls':len(asset_index),'relationships':relationships,'admin_accounts':c.execute('SELECT count(*) FROM users').fetchone()[0],'lexical_documents':lexical_documents,'lexical_uploads':lexical_uploads,'foreign_key_violations':len(foreign),'errors':errors,'passed':not errors}
(root/'stored-media-hashes.json').write_text(json.dumps(stored_hashes,indent=2)+'\n')
(root/'verification-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(report,ensure_ascii=False))
raise SystemExit(0 if not errors else 1)
