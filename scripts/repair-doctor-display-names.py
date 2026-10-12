"""Backfill localized doctor display names from saved public source evidence.

Stop the local Payload server before running. Existing editorial values are kept.
"""
import json
import sqlite3
from datetime import datetime
from pathlib import Path

root = Path(__file__).resolve().parents[1]
titles = {}
for source in ['full', 'extra']:
    for line in (root / 'imports' / source / 'records.jsonl').open():
        try:
            record = json.loads(line)
        except json.JSONDecodeError:
            # Interrupted crawl entries are not usable evidence. Missing titles fail below.
            continue
        url = record.get('canonical') or record.get('final_url') or record['source_url']
        titles[url.rstrip('/')] = record['title']

db = sqlite3.connect(root / 'payload-local.db', timeout=30)
rows = db.execute('SELECT _parent_id, _locale, slug FROM doctors_locales WHERE slug IS NOT NULL').fetchall()
plan = []
for doctor, locale, slug in rows:
    url = 'https://yeditepehastaneleri.com/' + ('en/' if locale == 'en' else '') + slug.strip('/')
    if url not in titles or not titles[url].strip():
        raise ValueError(f'Missing source title: {url}')
    plan.append((titles[url], doctor, locale))

backups = root / 'imports' / 'backups'
backups.mkdir(exist_ok=True)
backup_path = backups / f'before-doctor-display-names-{datetime.now():%Y%m%d-%H%M%S-%f}.db'
with sqlite3.connect(backup_path) as backup:
    db.backup(backup)

with db:
    columns = {row[1] for row in db.execute('PRAGMA table_info(doctors_locales)')}
    if 'display_name' not in columns:
        db.execute('ALTER TABLE doctors_locales ADD COLUMN display_name TEXT')
    for title, doctor, locale in plan:
        db.execute("UPDATE doctors_locales SET display_name = ? WHERE _parent_id = ? AND _locale = ? AND (display_name IS NULL OR display_name = '')", (title, doctor, locale))
    missing = db.execute("SELECT COUNT(*) FROM doctors_locales WHERE slug IS NOT NULL AND (display_name IS NULL OR display_name = '')").fetchone()[0]
    if missing:
        raise ValueError(f'{missing} localized display names are still missing')
print(json.dumps({'verified_locale_records': len(plan), 'backup': str(backup_path)}, ensure_ascii=False))
db.close()
