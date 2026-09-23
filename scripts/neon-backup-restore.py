"""Credential-safe pg_dump/pg_restore wrapper; restore refuses a non-empty DB.

Passwords are read from private URL files and passed through process environment,
never command arguments. Requires PostgreSQL 17 clients. Does not stop writers.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
from urllib.parse import urlsplit, unquote

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('action', choices=['backup', 'restore'])
parser.add_argument('--url-file', type=Path, required=True)
parser.add_argument('--expected-host', required=True)
parser.add_argument('--archive', type=Path, required=True)
parser.add_argument('--pg-bin', type=Path, required=True)
args = parser.parse_args()
url = urlsplit(args.url_file.read_text(encoding='utf-8').strip())
host = (url.hostname or '').replace('-pooler', '')
if host != args.expected_host or url.path != '/neondb' or not url.password:
    raise SystemExit('Connection identity mismatch; no action performed')
if args.action == 'restore' and not host.endswith('.ap-southeast-1.aws.neon.tech'):
    raise SystemExit('Restore is restricted to the Singapore target')
env = os.environ.copy()
env.update(PGHOST=host, PGUSER=unquote(url.username), PGPASSWORD=unquote(url.password),
           PGDATABASE='neondb', PGSSLMODE='require', PGCONNECT_TIMEOUT='30')

def run(tool, *arguments):
    exe = args.pg_bin / (tool + ('.exe' if os.name == 'nt' else ''))
    result = subprocess.run([str(exe), *map(str, arguments)], env=env, capture_output=True)
    if result.returncode:
        # SQL failure details may contain row values. Keep all failure output private.
        raise SystemExit(f'{tool} failed with exit code {result.returncode}; operation aborted')
    return result.stdout.decode('utf-8')

if args.action == 'backup':
    if args.archive.exists():
        raise SystemExit('Refusing to overwrite an existing backup')
    run('pg_dump', '-Fc', '--lock-wait-timeout=30s', '-f', args.archive)
    toc = run('pg_restore', '-l', args.archive)
    args.archive.with_suffix('.toc.txt').write_text(toc, encoding='utf-8')
    result = {'archive': args.archive.name, 'bytes': args.archive.stat().st_size,
              'sha256': hashlib.sha256(args.archive.read_bytes()).hexdigest()}
    args.archive.with_suffix('.sha256.json').write_text(json.dumps(result, indent=2))
    print(json.dumps(result))
else:
    count = run('psql', '-XAt', '-v', 'ON_ERROR_STOP=1', '-c',
                "SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace "
                "WHERE n.nspname NOT IN ('pg_catalog','information_schema') "
                "AND n.nspname !~ '^pg_toast' AND c.relkind IN ('r','p','S','v','m','f')").strip()
    if count != '0':
        raise SystemExit('Target is not empty. Refusing to merge or overwrite data')
    toc = run('pg_restore', '-l', args.archive)
    lines = toc.splitlines()
    skipped = [line for line in lines if 'DEFAULT ACL' in line and 'cloud_admin' in line]
    # Exclude only Neon platform-owned default ACLs; preserve application owners/ACLs.
    restore_toc = args.archive.with_suffix('.restore-toc.txt')
    restore_toc.write_text('\n'.join('; ' + line if line in skipped else line for line in lines) + '\n', encoding='utf-8')
    run('pg_restore', '--single-transaction', '--exit-on-error', '-L', restore_toc, '-d', 'neondb', args.archive)
    print(json.dumps({'restored': True, 'excludedProviderDefaultACLs': len(skipped)}))
