import json,re,runpy,hashlib
from pathlib import Path
from urllib.parse import urlparse,urljoin
from bs4 import BeautifulSoup
h=runpy.run_path('scripts/harvest-public.py');root=Path('imports/full');out=Path('imports/extra');out.mkdir(exist_ok=True)
known=set(json.loads((root/'inventory.json').read_text())['urls']);extra=set();refresh=set();records=[]
if (out/'records.jsonl').exists():
 for line in (out/'records.jsonl').open():
  try:known.add(json.loads(line)['source_url'])
  except:pass
if (out/'report.json').exists():known.update(e['url'] for e in json.loads((out/'report.json').read_text())['errors'])
if (out/'prior-errors.json').exists():known.update(e['url'] for e in json.loads((out/'prior-errors.json').read_text()))
import itertools
inputs=[root/'records.jsonl']+([out/'records.jsonl'] if (out/'records.jsonl').exists() else [])
for line in itertools.chain.from_iterable(p.open() for p in inputs):
 try:r=json.loads(line)
 except json.JSONDecodeError:continue

 if 'accordion-item' in r['extraction']['classes']:
  header=BeautifulSoup(r['main_html'],'lxml').select_one('.accordion-header')
  if header and not header.get_text(' ',strip=True):refresh.add(r['source_url'])
  else:refresh.discard(r['source_url'])
 for url in r['source_links']:
  u=urlparse(url)
  if h['permitted'](url) and url not in known and not u.path.startswith(('/sites/','/themes/','/core/')) and not re.search(r'\.(pdf|jpg|jpeg|png|gif|svg|webp|zip|docx?)$',u.path,re.I):extra.add(url)
globals=[];menus=[]
for locale,url in [('tr',h['BASE']+'/'),('en',h['BASE']+'/en')]:
 html,_=h['get'](url);s=BeautifulSoup(html,'lxml');(out/('homepage-'+locale+'.html')).write_text(html)
 for a in s.select('header a[href], footer a[href]'):
  u=urljoin(url,a['href']).split('#')[0];p=urlparse(u)
  if h['permitted'](u) and u not in known and not p.path.startswith(('/sites/','themes/')) and not re.search(r'\.(pdf|jpg|jpeg|png|gif|svg|webp|zip|docx?)$',p.path,re.I):extra.add(u)
 for region in ['header','footer']:
  el=s.select_one(region)
  if not el:continue
  menu_key=region+'-'+locale;items=[];seen=set()
  for i,a in enumerate(el.select('a[href]')):
   link=urljoin(url,a['href']);title=a.get_text(' ',strip=True)
   if title and h['permitted'](link) and (title,link) not in seen:
    seen.add((title,link));items.append({'title':title,'url':link,'sort':i})
  menus.append({'key':menu_key,'locale':locale,'items':items})
(root/'menus-public.json').write_text(json.dumps(menus,ensure_ascii=False,indent=2))
(out/'extra-urls.json').write_text(json.dumps(sorted(extra|refresh),ensure_ascii=False,indent=2));print('extra links',len(extra),'accordion refreshes',len(refresh),'menus',[(m['key'],len(m['items'])) for m in menus])
