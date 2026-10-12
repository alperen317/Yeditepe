"""Create a private SQLite + media + environment transfer archive (Python 3)."""
import argparse
import hashlib
import json
import pathlib
import sqlite3
import tarfile
import tempfile
from datetime import datetime, timezone

ROOT = pathlib.Path(__file__).resolve().parents[1]

def digest(path):
    h = hashlib.sha256()
    with path.open('rb') as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('archive', type=pathlib.Path)
    args = parser.parse_args()
    archive = args.archive.resolve()
    if archive.exists():
        raise SystemExit('Archive already exists; choose a new filename.')
    archive.parent.mkdir(parents=True, exist_ok=True)
    for required in ['payload-local.db', '.env', 'media']:
        if not (ROOT / required).exists():
            raise SystemExit('Missing: ' + required)
    with tempfile.TemporaryDirectory(prefix='yeditepe-transfer-') as directory:
        stage = pathlib.Path(directory)
        db = stage / 'payload-local.db'
        with sqlite3.connect((ROOT / 'payload-local.db').as_uri() + '?mode=ro', uri=True) as source:
            with sqlite3.connect(db) as target:
                source.backup(target)
        with sqlite3.connect(db) as check:
            if check.execute('PRAGMA integrity_check').fetchone()[0] != 'ok':
                raise SystemExit('SQLite integrity check failed.')
            filenames = [row[0] for row in check.execute('SELECT filename FROM media') if row[0]]
            missing = [name for name in filenames if not (ROOT / 'media' / name).is_file()]
            if missing:
                raise SystemExit('Missing media files: ' + str(len(missing)))
        files = [('payload-local.db', db), ('.env', ROOT / '.env')]
        files += [(p.relative_to(ROOT).as_posix(), p) for p in sorted((ROOT / 'media').rglob('*')) if p.is_file() and p.name != '.DS_Store']
        manifest = {'format': 1, 'createdAt': datetime.now(timezone.utc).isoformat(),
                    'mediaRecords': len(filenames), 'missingMedia': 0,
                    'files': {name: {'sha256': digest(path), 'bytes': path.stat().st_size} for name, path in files}}
        (stage / 'manifest.json').write_text(json.dumps(manifest, indent=2))
        partial = archive.with_name(archive.name + '.partial')
        try:
            with tarfile.open(partial, 'w:gz', compresslevel=1) as tar:
                tar.add(stage / 'manifest.json', arcname='manifest.json')
                for name, path in files:
                    tar.add(path, arcname=name)
            partial.replace(archive)
            archive.chmod(0o600)
        finally:
            partial.unlink(missing_ok=True)
        print(json.dumps({'archive': str(archive), 'bytes': archive.stat().st_size, 'mediaRecords': len(filenames), 'files': len(files)}))

if __name__ == '__main__':
    main()
