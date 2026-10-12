"""Public GET-only, resumable content harvest. No Drupal credentials or mutations."""
import argparse, hashlib, json, time, threading, re
from pathlib import Path
from urllib.parse import urlparse, urljoin, quote, unquote, urlunparse
from urllib.request import Request, build_opener, HTTPRedirectHandler
from urllib.robotparser import RobotFileParser
from concurrent.futures import ThreadPoolExecutor, as_completed
import xml.etree.ElementTree as ET
from bs4 import BeautifulSoup

BASE='https://yeditepehastaneleri.com'; AGENT='YeditepeContentMigration/1.0'
BLOCKED={'admin','user','users','search','webform','e-randevu','randevu','randevularim','old-randevularim','appointment','appointments','e-appointment','e-sonuc','e-result','login','logout','register','password','patient-portal','online-randevu'}
lock=threading.Lock(); last_request=0

def permitted(url):
    u=urlparse(url); parts=set(u.path.lower().strip('/').split('/'))
    return u.scheme=='https' and u.netloc=='yeditepehastaneleri.com' and not (parts & BLOCKED) and (not u.query or u.path=='/sitemap.xml')
class SafeRedirect(HTTPRedirectHandler):
    def redirect_request(self,req,fp,code,msg,headers,newurl):
        if not permitted(newurl):raise ValueError('Redirect outside public content scope')
        return super().redirect_request(req,fp,code,msg,headers,newurl)
def get(url):
    global last_request
    if not permitted(url):raise ValueError('URL outside public content scope')
    with lock:
        delay=.2-(time.monotonic()-last_request)
        if delay>0:time.sleep(delay)
        last_request=time.monotonic()
    u=urlparse(url);safe=urlunparse(u._replace(path=quote(unquote(u.path),safe='/@:+')))
    with build_opener(SafeRedirect()).open(Request(safe,headers={'User-Agent':AGENT}),timeout=30) as r:
        data=r.read(8_000_001)
        if len(data)>8_000_000:raise ValueError('Response too large')
        return data.decode('utf-8','replace'),r.geturl()
def links(el,url):
    return list(dict.fromkeys(urljoin(url,a['href']).split('#')[0] for a in el.select('a[href]') if permitted(urljoin(url,a['href']).split('#')[0]))) if el else []
def extract(html,url):
    soup=BeautifulSoup(html,'lxml');main=soup.select_one('main')
    if not main:raise ValueError('No main content; possible error page')
    title=soup.select_one('h1');title_text=title.get_text(' ',strip=True) if title else (soup.title.get_text(' ',strip=True) if soup.title else '')
    if not title_text:raise ValueError('No page title')
    lang='en' if urlparse(url).path=='/en' or urlparse(url).path.startswith('/en/') else 'tr'
    actual_lang=soup.html.get('lang','') if soup.html else ''
    if actual_lang and not actual_lang.lower().startswith(lang):raise ValueError('Language mismatch')
    alt={x.get('hreflang'):urljoin(url,x['href']) for x in soup.select('link[rel="alternate"][hreflang][href]') if x.get('hreflang') in ['tr','en']}
    canonical=soup.select_one('link[rel="canonical"]');canonical=canonical.get('href') if canonical else url
    desc=soup.select_one('meta[name="description"]');og=soup.select_one('meta[property="og:image"]')
    sections={}
    for selector in ['.physicians-top-wrapper','.hospitals-top-wrapper','.hospitals-list','.hospital-doctors-list','.ilgili-videolar','.ilgili-yazilar','.blog-body','.news-body','.videos-detail']:
        el=main.select_one(selector)
        if el:sections[selector]={'links':links(el,url),'text':el.get_text(' ',strip=True)}
    contacts=main.select_one('.physicians-top-wrapper, .hospitals-top-wrapper')
    emails=list(dict.fromkeys(a.get('href','')[7:] for a in contacts.select('a[href^="mailto:"]'))) if contacts else []
    phones=list(dict.fromkeys(a.get('href','')[4:] for a in contacts.select('a[href^="tel:"]'))) if contacts else []
    embeds=[urljoin(url,x.get('src','')) for x in main.select('iframe[src]')]
    attrs=[x.get('class',[]) for x in main.select('[class]')]
    node_ids=re.findall(r'webform-submission-[^\s"\']+-node-(\d+)-form',html)
    images=list(dict.fromkeys(urljoin(url,img['src']) for img in main.select('img[src]')))
    src_links=links(main,url)
    # Keep document bodies, strip executable / form surfaces and appointment widgets.
    for el in main.select('script,style,form,input,textarea,select,.modal,.shared-component,.detail-cta,.randevu-btn'):
        el.decompose()
    for button in main.select('button'):button.name='span'
    for el in main.find_all(True):
        for key in list(el.attrs):
            if key.lower().startswith('on') or key in ['nonce','data-drupal-selector']:del el.attrs[key]
    for a in main.select('a[href]'):
        if not permitted(urljoin(url,a['href'])):del a['href']
    body_selector=next((sel for sel in ['.blog-body','.news-body','.physicians-bottom-wrapper','.hospitals-bottom-wrapper','.videos-detail'] if main.select_one(sel)),None)
    body=main.select_one(body_selector) if body_selector else None
    return dict(source_url=url,final_url=url,title=title_text,language=lang,canonical=canonical,main_html=str(main),body_html=str(body) if body else None,
        source_links=src_links,source_images=images,translations=alt,
        extraction={'version':2,'body_selector':body_selector,'sections':sections,'emails':emails,'phones':phones,'embeds':embeds,'cover_url':og.get('content') if og else None,
        'description':desc.get('content') if desc else None,'classes':sorted(set(c for arr in attrs for c in arr)), 'possible_node_ids':sorted(set(node_ids)),
        'source_html_sha256':hashlib.sha256(html.encode()).hexdigest(),'complete_drupal_entity':False})
def main():
    p=argparse.ArgumentParser();p.add_argument('--limit',type=int,default=25);p.add_argument('--all',action='store_true');p.add_argument('--inventory-only',action='store_true');p.add_argument('--out',default='imports/full');p.add_argument('--workers',type=int,default=3);p.add_argument('--extra-json');p.add_argument('--only-extra',action='store_true');p.add_argument('--refresh',action='store_true');a=p.parse_args()
    out=Path(a.out);out.mkdir(parents=True,exist_ok=True)
    text,_=get(BASE+'/robots.txt');robots=RobotFileParser();robots.parse(text.splitlines());pending=[BASE+'/sitemap.xml'];seen=set();urls=set()
    while pending:
        u=pending.pop(0)
        if u in seen:continue
        seen.add(u);xml,_=get(u);root=ET.fromstring(xml);locs=[e.text for e in root.iter() if e.tag.endswith('}loc') and e.text]
        if root.tag.endswith('}sitemapindex'):pending.extend(locs)
        else:urls.update(locs)
    extras=set(json.loads(Path(a.extra_json).read_text())) if a.extra_json else set()
    if a.only_extra:urls=extras
    else:urls.update(extras)
    eligible=sorted(u for u in urls if permitted(u) and robots.can_fetch(AGENT,u))
    inventory={'sitemap_urls':len(urls),'eligible_urls':len(eligible),'excluded_urls':sorted(urls-set(eligible)),'urls':eligible}
    (out/'inventory.json').write_text(json.dumps(inventory,ensure_ascii=False,indent=2))
    if a.inventory_only:print(f'Inventory: {len(eligible)} eligible public URLs',flush=True);return
    # Small content types first, so collection coverage becomes visible early.
    eligible.sort(key=lambda u:('/health-guide/' in u or '/saglik-rehberi/' in u or '/videolar/' in u,u))
    selected=eligible if a.all else eligible[:a.limit];records=out/'records.jsonl';done=set();errors=[]
    if records.exists():done={json.loads(l)['source_url'] for l in records.open() if l}
    tasks=[u for u in selected if a.refresh or u not in done]
    def fetch_record(u):
        for attempt in range(3):
            try:
                html,final=get(u);record=extract(html,final);record['source_url']=u;record['final_url']=final;return record
            except Exception:
                if attempt==2:raise
                time.sleep(1+attempt*2)
    def report():
        r={'source_mode':'public_get_only','eligible_urls':len(eligible),'selected_urls':len(selected),'saved_records':len(done),'errors':errors,'full_drupal_export':False,
        'missing':['drafts','exact paragraph revisions','private files','hidden entity relationships','unrendered fields'],'drupal_mutations':0}
        (out/'report.json').write_text(json.dumps(r,ensure_ascii=False,indent=2));return r
    print(f'Inventory {len(eligible)}; to read {len(tasks)}; workers {a.workers}',flush=True)
    with ThreadPoolExecutor(max_workers=min(max(a.workers,1),4)) as pool,records.open('a') as f:
        future_urls={pool.submit(fetch_record,u):u for u in tasks}
        for i,future in enumerate(as_completed(future_urls),1):
            u=future_urls[future]
            try:r=future.result();f.write(json.dumps(r,ensure_ascii=False)+'\n');f.flush();done.add(u)
            except Exception as e:errors.append({'url':u,'error':str(e)})
            if i%50==0:report();print(f'Read {i}/{len(tasks)}; saved {len(done)}; errors {len(errors)}',flush=True)
    print(json.dumps(report(),ensure_ascii=False),flush=True)
if __name__=='__main__':main()
