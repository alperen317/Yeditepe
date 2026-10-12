"""Verify and restore a private transfer archive into an empty local checkout."""
import argparse
import hashlib
import json
import pathlib
import shutil
import sqlite3
import tarfile
import tempfile

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
    parser.add_argument('--verify-only', action='store_true')
    args = parser.parse_args()
    if not args.verify_only:
        for name in ['payload-local.db', '.env', 'media']:
            if (ROOT / name).exists():
                raise SystemExit('Restore refused: existing ' + name + '. Use a fresh checkout.')
    with tempfile.TemporaryDirectory(prefix='yeditepe-restore-') as directory:
        stage = pathlib.Path(directory)
        with tarfile.open(args.archive, 'r:gz') as tar:
            seen = set()
            for member in tar.getmembers():
                name = member.name
                path = pathlib.PurePosixPath(name)
                if name in seen or path.is_absolute() or '..' in path.parts or not member.isfile():
                    raise SystemExit('Unsafe archive member.')
                if name not in ['manifest.json', 'payload-local.db', '.env'] and not name.startswith('media/'):
                    raise SystemExit('Unexpected archive member.')
                seen.add(name)
                destination = stage / name
                destination.parent.mkdir(parents=True, exist_ok=True)
                with tar.extractfile(member) as source, destination.open('wb') as target:
                    shutil.copyfileobj(source, target)
        manifest = json.loads((stage / 'manifest.json').read_text())
        if manifest.get('format') != 1 or set(manifest['files']) != seen - {'manifest.json'}:
            raise SystemExit('Invalid manifest.')
        for name, expected in manifest['files'].items():
            path = stage / name
            if path.stat().st_size != expected['bytes'] or digest(path) != expected['sha256']:
                raise SystemExit('Checksum mismatch: ' + name)
        with sqlite3.connect((stage / 'payload-local.db').as_uri() + '?mode=ro', uri=True) as db:
            if db.execute('PRAGMA integrity_check').fetchone()[0] != 'ok':
                raise SystemExit('SQLite integrity check failed.')
        if args.verify_only:
            print('Archive verified: database, environment and all media checksums match.')
            return
        env = (stage / '.env').read_text().splitlines()
        overrides = {'DATABASE_URL': 'file:./payload-local.db', 'NEXT_PUBLIC_SERVER_URL': 'http://127.0.0.1:3202'}
        env = [line for line in env if line.split('=', 1)[0].strip() not in overrides]
        env += [key + '=' + value for key, value in overrides.items()]
        for name in ['payload-local.db', 'media']:
            shutil.move(str(stage / name), str(ROOT / name))
        (ROOT / '.env').write_text('\n'.join(env) + '\n')
        (ROOT / '.env').chmod(0o600)
        print('Restored. Next: npm ci && npm run dev')

if __name__ == '__main__':
    main()
