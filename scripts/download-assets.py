"""Download only public website assets referenced by harvested content."""
import argparse, json, hashlib, time, threading, mimetypes
from pathlib import Path
from urllib.request import Request,build_opener,HTTPRedirectHandler
from urllib.parse import urlparse,quote,unquote,urlunparse
from concurrent.futures import ThreadPoolExecutor,as_completed
lock=threading.Lock();last=0

def permitted(url):
 u=urlparse(url)
 return u.scheme=='https' and u.netloc=='yeditepehastaneleri.com' and u.path.startswith('/sites/default/files/') and not any(x in u.path.lower() for x in ['/private/','webform'])
class Redirect(HTTPRedirectHandler):
 def redirect_request(self,req,fp,code,msg,headers,newurl):
  if not permitted(newurl):raise ValueError('Asset redirect outside allowed public files')
  return super().redirect_request(req,fp,code,msg,headers,newurl)
def fetch(url,root):
 global last
 if not permitted(url):raise ValueError('Asset URL outside public files')
 u=urlparse(url);safe=urlunparse(u._replace(path=quote(unquote(u.path),safe='/@:+')))
 with lock:
  delay=.2-(time.monotonic()-last)
  if delay>0:time.sleep(delay)
  last=time.monotonic()
 with build_opener(Redirect()).open(Request(safe,headers={'User-Agent':'YeditepeContentMigration/1.0'}),timeout=35) as r:
  mime=r.headers.get_content_type();data=r.read(40_000_001)
  if data.startswith(b'\x89PNG\r\n\x1a\n'):mime='image/png'
  elif data.startswith(b'\xff\xd8\xff'):mime='image/jpeg'
  elif data[:6] in [b'GIF87a',b'GIF89a']:mime='image/gif'
  elif data[:4]==b'RIFF' and data[8:12]==b'WEBP':mime='image/webp'
  elif data.startswith(b'%PDF-'):mime='application/pdf'
  if len(data)>40_000_000:raise ValueError('Asset exceeds 40 MB')
  if not (mime.startswith('image/') or mime in ['application/pdf','video/mp4','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document']):raise ValueError('Unexpected MIME '+mime)
  sha=hashlib.sha256(data).hexdigest();suffix=mimetypes.guess_extension(mime) or Path(u.path).suffix or '.bin';filename=sha+suffix;dest=root/'assets'/filename
  if not dest.exists():dest.write_bytes(data)
  return {'url':url,'path':str(dest.resolve()),'sha256':sha,'mime':mime,'bytes':len(data)}
def main():
 p=argparse.ArgumentParser();p.add_argument('--dir',default='imports/full');a=p.parse_args();root=Path(a.dir);(root/'assets').mkdir(exist_ok=True)
 urls=json.loads((root/'assets-plan.json').read_text());index=json.loads((root/'asset-index.json').read_text()) if (root/'asset-index.json').exists() else {};errors=[];tasks=[u for u in urls if u not in index]
 def save():
  temp=root/'asset-index.tmp';temp.write_text(json.dumps(index,ensure_ascii=False));temp.replace(root/'asset-index.json')
  (root/'asset-report.json').write_text(json.dumps({'planned_urls':len(urls),'downloaded_urls':len(index),'unique_files':len(set(v['sha256'] for v in index.values())),'errors':errors},ensure_ascii=False,indent=2))
 print(f'Assets to download: {len(tasks)}',flush=True)
 with ThreadPoolExecutor(max_workers=3) as pool:
  future_urls={pool.submit(fetch,u,root):u for u in tasks}
  for i,f in enumerate(as_completed(future_urls),1):
   u=future_urls[f]
   try:index[u]=f.result()
   except Exception as e:errors.append({'url':u,'error':str(e)})
   if i%50==0:save();print(f'Assets {i}/{len(tasks)}, downloaded {len(index)}, errors {len(errors)}',flush=True)
 save();print((root/'asset-report.json').read_text(),flush=True)
if __name__=='__main__':main()
