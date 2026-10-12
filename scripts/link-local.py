"""Bind observed relations in local SQLite without re-saving large rich text arrays."""
import sqlite3,json,uuid,shutil
from pathlib import Path
from urllib.parse import urljoin
from collections import defaultdict
root=Path('imports/full');db=Path('payload-local.db')
if not (root/'before-relation-repair.db').exists():shutil.copy2(db,root/'before-relation-repair.db')
c=sqlite3.connect(db);c.execute('PRAGMA foreign_keys=ON')
schemas={s['slug']:s for s in json.load(open('src/collections/content-schema.json'))};entries=[json.loads(l) for l in open(root/'normalized.jsonl')]
actual={};reviewed=set();aliases={}
canon=lambda u:u.split('#')[0].rstrip('/')
for slug,s in schemas.items():
 table=slug.replace('-','_');cols={r[1] for r in c.execute(f'pragma table_info("{table}")')}
 if 'source_key' not in cols:continue
 meta='source_metadata' if 'source_metadata' in cols else 'NULL'
 for id,key,m in c.execute(f'SELECT id,source_key,{meta} FROM "{table}"'):
  actual[(slug,key)]=id
  if m and json.loads(m).get('import_state')=='reviewed':reviewed.add((slug,id))
for e in entries:
 id=actual.get((e['collection'],e['source_key']))
 if id:
  for url in e['aliases']:aliases[canon(url)]=(e['collection'],id)
plans={};inverse=defaultdict(set)
for e in entries:
 slug=e['collection'];id=actual.get((slug,e['source_key']));locale=e['locale']
 if not id or (slug,id) in reviewed:continue
 fields={f.get('name'):f for f in schemas[slug]['fields']};rels=dict(e['relations'])
 if slug=='articles':
  parent=aliases.get(canon(urljoin(e['source_url']+'/', '..')))
  if parent and parent[0]=='categories':rels['categories']=[urljoin(e['source_url']+'/', '..')]
 for name,urls in rels.items():
  field=fields.get(name)
  if not field:continue
  target=field.get('relationTo') or next((f.get('relationTo') for f in field.get('fields',[]) if f.get('name')=='item'),None)
  ids=list(dict.fromkeys(aliases[canon(url)][1] for url in urls if canon(url) in aliases and aliases[canon(url)][0]==target))
  if ids:plans[(slug,id,locale,name)]=(field,target,ids)
 if slug=='medical-units':
  for url in rels.get('facilities',[]):
   found=aliases.get(canon(url))
   if found and found[0]=='facilities' and found not in reviewed:inverse[(found[1],locale)].add(id)
for (id,locale),ids in inverse.items():
 key=('facilities',id,locale,'medical_units');field=next(f for f in schemas['facilities']['fields'] if f.get('name')=='medical_units');previous=plans.get(key,(None,None,[]))[2];plans[key]=(field,'medical-units',list(dict.fromkeys(previous+sorted(ids))))
count=0
with c:
 # Discard only public-imported rendered relationship arrays, then rebuild exactly.
 for slug,name in [('articles','related_articles'),('articles','doctors'),('articles','videos')]:
  table=slug.replace('-','_')+'_'+name
  for (s,id) in actual.items():
   if s[0]!=slug or (slug,id) in reviewed:continue
   c.execute(f'DELETE FROM "{table}" WHERE _parent_id=?',(id,))
 for (slug,id,locale,name),(field,target,ids) in plans.items():
  table=slug.replace('-','_')
  if field['type']=='array':
   arr=table+'_'+name
   cols={r[1] for r in c.execute(f'PRAGMA table_info("{arr}")')}
   for order,item in enumerate(ids,1):
    data={'_order':order,'_parent_id':id,'_locale':locale,'id':uuid.uuid4().hex[:24],'item_id':item}
    if 'role' in cols:data['role']='related_expert'
    if 'source_role' in cols:data['source_role']='related_content'
    keys=list(data);c.execute(f'INSERT INTO "{arr}" ({",".join(keys)}) VALUES ({",".join("?" for _ in keys)})',list(data.values()))
  elif field.get('hasMany'):
   rel=table+'_rels';target_col=target.replace('-','_')+'_id'
   c.execute(f'DELETE FROM "{rel}" WHERE parent_id=? AND path=? AND locale=?',(id,name,locale))
   for order,item in enumerate(ids,1):c.execute(f'INSERT INTO "{rel}" ("order",parent_id,path,locale,"{target_col}") VALUES (?,?,?,?,?)',(order,id,name,locale,item))
  count+=len(ids)
 # Remove obsolete unreviewed CV entries created by the earlier section parser.
 wanted={d['source_key'] for e in entries for d in e['derived'] if d['collection']=='doctor-cv-entries'}
 obsolete=[r for r in c.execute('SELECT id,source_key,source_metadata FROM doctor_cv_entries') if r[1] and r[1].startswith('public:') and r[1] not in wanted and ('doctor-cv-entries',r[0]) not in reviewed]
 for id,key,meta in obsolete:c.execute('DELETE FROM doctor_cv_entries WHERE id=?',(id,))
 # Keep every source URL associated with a deduplicated file.
 groups=defaultdict(list)
 for url,a in json.load(open(root/'asset-index.json')).items():groups[a['sha256']].append(url)
 for sha,urls in groups.items():c.execute('UPDATE media SET source_urls=? WHERE source_sha256=?',(json.dumps(urls),sha))
report={'relationships_written':count,'localized_field_groups':len(plans),'obsolete_cv_removed':len(obsolete),'url_aliases':len(aliases),'foreign_key_errors':list(c.execute('PRAGMA foreign_key_check'))}
(root/'relationship-report.json').write_text(json.dumps(report,indent=2)+'\n');(root/'url-id-map.json').write_text(json.dumps({k:{'collection':v[0],'id':v[1]} for k,v in aliases.items()},indent=2)+'\n');print(report)
c.close()
