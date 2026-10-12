"""Normalize harvested public pages. Every mapping retains its rendered evidence."""
import json,hashlib,re,argparse,collections
from pathlib import Path
from urllib.parse import urlparse,urljoin
from bs4 import BeautifulSoup

def key(url):return 'public:'+hashlib.sha256(url.encode()).hexdigest()
def cleanurl(url):return url.split('#')[0].rstrip('/') or 'https://yeditepehastaneleri.com'
def valid_asset(url):
 u=urlparse(url)
 return u.scheme=='https' and u.netloc=='yeditepehastaneleri.com' and u.path.startswith('/sites/default/files/') and not any(x in u.path.lower() for x in ['webform','private'])
def text(el):return el.get_text(' ',strip=True) if el else ''
def anchors(el,url):return list(dict.fromkeys(urljoin(url,a['href']).split('#')[0] for a in el.select('a[href]'))) if el else []
def one(s,selector):
 for sel in selector.split(','):
  sel=sel.strip()
  if sel.startswith('.') and ' ' not in sel:
   found=s.find(class_=sel[1:])
   if found:return found
  else:
   found=s.select_one(sel)
   if found:return found
 return None
def classify(r,s):
 path=urlparse(r.get('final_url') or r['canonical']).path;parts=path.strip('/').split('/');parts=parts[1:] if parts and parts[0]=='en' else parts
 if any(x in path for x in ['/yonetim-kurulu/','/board-management/']):return 'board-members'
 if one(s,'.physicians-top-wrapper'):return 'doctors'
 if one(s,'.hospitals-wrapper'):return 'facilities'
 if one(s,'.videos-detail'):return 'videos'
 if one(s,'.blog-body'):return 'articles'
 if parts and parts[0] in ['tibbi-birimler','services'] and len(parts)>1:return 'medical-units'
 if one(s,'.events-detail'):return 'events'
 if parts and parts[0] in ['kurumsal','corporate'] and one(s,'.news-body'):return 'articles'
 if parts and parts[0] in ['medikal-teknoloji','medikal-teknolojiler','medical-technology','medical-technologies'] and len(parts)>1:return 'medical-technologies'
 if parts and parts[0] in ['saglik-rehberi','health-guide'] and len(parts)<=2 and not r.get('body_html'):return 'categories'
 return 'pages'
def normalize(r):
 s=BeautifulSoup(r['main_html'],'lxml');collection=classify(r,s);ex=r['extraction'];identity=r.get('translations',{}).get('tr') or r['canonical'] or r['source_url']
 body=r.get('body_html') or str(one(s,'.events-detail') or s);slug=urlparse(r['canonical']).path.removeprefix('/en').strip('/') or 'home'
 data={'status':'draft','source_url':identity,'source_key':key(identity),'translation_status':'draft','slug':slug,'title':r['title'],'seo_title':r['title'],'seo_description':ex.get('description'),'source_metadata':{'mode':'public_rendered','import_state':'needs_review','complete_entity':False}}
 relations={};assets=[];field_assets={};derived=[]
 cover=ex.get('cover_url')
 if cover and valid_asset(cover):assets.append(cover);field_assets['photo' if collection in ['doctors','board-members'] else 'thumbnail' if collection=='videos' else 'cover_image']=cover;field_assets['social_image']=cover
 primary=BeautifulSoup(body,'lxml')
 for el in primary.select('img[src], a[href]'):
  a=urljoin(r['source_url'],el.get('src') or el.get('href',''))
  if valid_asset(a):assets.append(a)
 if collection=='articles':data.update(body=body,kind='health_guide' if one(s,'.blog-body') else 'corporate_news',source_bundle='blog' if one(s,'.blog-body') else 'haberler')
 elif collection=='doctors':
  top=one(s,'.physicians-top-wrapper');data.update(full_name=r['title'],display_name=r['title'],biography=body,source_bundle='hekimler',public_emails=ex.get('emails',[]),public_email=next(iter(ex.get('emails',[])),None),spoken_languages=text(one(s,'.doctors-language')))
  relations['facilities']=anchors(top,r['source_url']);relations['medical_units']=anchors(top,r['source_url'])
  data['academic_title']=re.match(r'^(Prof\.\s*(?:Dr\.)?|Doç\.\s*Dr\.|Assoc\.?\s*Prof\.?|Dr\.\s*Öğr\.\s*Üyesi|Uzm\.\s*Dr\.|Dr\.|Research Assistant|Dt\.|Uzm\.\s*Dt\.)',r['title']).group(1) if re.match(r'^(Prof\.\s*(?:Dr\.)?|Doç\.\s*Dr\.|Assoc\.?\s*Prof\.?|Dr\.\s*Öğr\.\s*Üyesi|Uzm\.\s*Dr\.|Dr\.|Research Assistant|Dt\.|Uzm\.\s*Dt\.)',r['title']) else None
  rank=data.get('academic_title')
  if rank:
   code='prof' if rank.startswith('Prof.') else 'associate_prof' if rank.startswith(('Doç.','Assoc')) else 'assistant_prof' if 'Öğr.' in rank else 'specialist' if rank.startswith('Uzm.') else 'research_assistant' if rank.startswith('Research') else 'dentist' if 'Dt.' in rank else 'doctor'
   derived.append({'collection':'doctor-titles','source_key':'public:doctor-title:'+code,'data':{'key':code,'title':rank,'abbreviation':rank,'status':'draft'},'owner_field':None,'parent_field':'title_id'})
  for h in s.select('.physicians-bottom-wrapper h2, .physicians-bottom-wrapper h3'):
   title=text(h).lower();kind='membership' if any(x in title for x in ['dernek','membership','club']) else 'award' if any(x in title for x in ['ödül','award']) else 'employment' if any(x in title for x in ['kariyer','career']) else None
   if not kind:continue
   items=[]
   for sibling in h.next_siblings:
    if getattr(sibling,'name',None) in ['h2','h3']:break
    if getattr(sibling,'name',None):
     if sibling.name=='li':items.append(sibling)
     else:items.extend(sibling.select('li'))
   for i,li in enumerate(items):
    val=text(li)
    if val:derived.append({'collection':'doctor-cv-entries','source_key':key(identity+'#cv-'+kind+'-'+str(i)),'data':{'kind':kind,'description':val,'sort':i},'owner_field':'doctor_id'})
 elif collection=='facilities':
  data.update(internal_name=r['title'],body=body,phone=next(iter(ex.get('phones',[])),None),email=next(iter(ex.get('emails',[])),None),source_bundle='hastaneler')
  top=one(s,'.hospitals-top-wrapper')
  if top:
   for p in top.select('p'):
    if text(p).lower() in ['adres','address']:
     data['address']=text(p.find_next_sibling('p'))
  relations['medical_units']=anchors(one(s,'.hospital-units-list, .tibbi-birimler-list'),r['source_url'])
 elif collection=='medical-units':
  data.update(internal_name=r['title'],body=body,source_bundle='tibbi_birimler');relations['facilities']=anchors(one(s,'.hospitals-list'),r['source_url'])
 elif collection=='videos':
  data.update(body=body,source_bundle='videolar');embeds=ex.get('embeds',[])
  for e in embeds:
   if 'youtube.com/embed/' in e:data.update(provider='youtube',provider_video_id=urlparse(e).path.split('/')[-1]);break
   if 'vimeo.com/' in e:data.update(provider='vimeo',provider_video_id=urlparse(e).path.split('/')[-1]);break
  relations['related_videos']=anchors(one(s,'.ilgili-videolar'),r['source_url'])
  relations['medical_units']=anchors(one(s,'.ilgili-tibbi-birimler, .hospitals-list'),r['source_url'])
 elif collection=='board-members':data.update(full_name=r['title'],biography=body,source_bundle='yonetim_kurulu')
 elif collection=='events':data.update(body=body,source_bundle='etkinlikler')
 elif collection=='categories':data.update(internal_name=r['title'],description=text(primary))
 elif collection=='medical-technologies':data.update(summary=text(primary),source_bundle='medikal_teknolojiler')
 else:data.update(internal_name=r['title'],body=body,type='landing' if not r.get('body_html') else 'corporate')
 # Rendered homepage slides become editable slider documents.
 for i,slide in enumerate(s.select('.slider-wrapper-link')):
  title_el=slide.select_one('.slider-title');summary_el=slide.select_one('.slider-summary');link=urljoin(r['source_url'],slide.get('href',''))
  title=text(title_el) or text(summary_el) or r['title']
  d={'title':title,'summary':text(summary_el),'link':link,'sort':i,'status':'draft','source_metadata':{'source_url':r['source_url'],'slide_link':link,'translation_match':'per-source-slide-link'}}
  da=slide.select_one('.desktop-image img[src]');ma=slide.select_one('.mobile-image img[src]');mapping={}
  for field,el in [('desktop_image',da),('mobile_image',ma)]:
   if el:
    asset=urljoin(r['source_url'],el['src'])
    if valid_asset(asset):assets.append(asset);mapping[field]=asset
  derived.append({'collection':'sliders','source_key':key(identity+'#slider:'+link),'data':d,'owner_field':None,'field_assets':mapping})
 # FAQ questions remain text after sanitizer converts buttons to inert spans.
 for i,item in enumerate(s.select('.accordion-item')):
  question=text(item.select_one('.accordion-header'));answer=item.select_one('.accordion-body')
  if question and answer:
   derived.append({'collection':'faqs','source_key':key(identity+'#faq-'+str(i)),'data':{'question':question,'answer':str(answer),'status':'draft'},'owner_field':None})
 # Specific rendered sections are evidence; general sidebars are deliberately not canonical links.
 if collection in ['articles','videos']:
  for field,selectors in [('doctors','.ilgili-hekimler, .ilgili-doktorlar, .doctor-info, .blog-author'),('medical_units','.ilgili-tibbi-birimler'),('related_articles','.ilgili-yazilar, .ilgili-yazilar-blog'),('videos','.ilgili-videolar')]:
   if collection=='videos' and field in ['related_articles','videos']:continue
   el=one(s,selectors)
   if el:relations[field]=anchors(el,r['source_url'])
 # The original rendered HTML is retained alongside editable content; no fabricated paragraph IDs.
 data['source_metadata']['sources']={r['language']:{'url':r['source_url'],'canonical':r['canonical'],'hash':ex.get('source_html_sha256'),'translations':r.get('translations'),'rendered_sections':list(ex.get('sections',{})),'missing_internal_relationships':True}}
 aliases=list(dict.fromkeys([r['source_url'],r['canonical'],r.get('final_url',r['source_url'])]+list(r.get('translations',{}).values())))
 return {'collection':collection,'source_key':data['source_key'],'identity':identity,'locale':r['language'],'aliases':aliases,'data':data,'body_html':body,'relations':relations,'assets':list(dict.fromkeys(assets)),'field_assets':field_assets,'derived':derived,'source_url':r['source_url']}
def safe_normalize(record):
 try:return normalize(record),None
 except Exception as e:return None,{'error':str(e),'source_url':record.get('source_url')}
def main():
 from concurrent.futures import ProcessPoolExecutor
 p=argparse.ArgumentParser();p.add_argument('--dir',default='imports/full');a=p.parse_args();root=Path(a.dir);counts=collections.Counter();errors=[];assets=set();unique=set()
 # Latest read wins, including repaired FAQ markup. Only full JSON lines are accepted.
 latest={}
 inputs=[root/'records.jsonl']+([Path('imports/extra/records.jsonl')] if Path('imports/extra/records.jsonl').exists() else [])
 for file in inputs:
  for line in file.open():
   try:r=json.loads(line);latest[r['source_url']]=r
   except json.JSONDecodeError:errors.append({'error':'Incomplete JSON line','file':str(file)})
 print('Normalizing '+str(len(latest))+' pages',flush=True)
 with ProcessPoolExecutor(max_workers=4) as pool,(root/'normalized.jsonl').open('w') as f:
  for i,(n,error) in enumerate(pool.map(safe_normalize,latest.values(),chunksize=20),1):
   if error:errors.append(error);continue
   f.write(json.dumps(n,ensure_ascii=False)+'\n');counts[n['collection']]+=1;unique.add((n['collection'],n['source_key']));assets.update(n['assets'])
   if i%500==0:print('Normalized '+str(i),flush=True)
 (root/'assets-plan.json').write_text(json.dumps(sorted(assets),ensure_ascii=False,indent=2));report={'localized_records':dict(counts),'unique_records':len(unique),'source_urls':len(latest),'asset_urls':len(assets),'errors':errors};(root/'normalization-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print(json.dumps(report,ensure_ascii=False))
if __name__=='__main__':main()
