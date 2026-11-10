#!/usr/bin/env python3
"""Verify a deployed site's revision and representative public resources."""
import argparse
import json
import re
import sys
import time
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urljoin, urlsplit
from urllib.request import Request, urlopen

CHECKS = (
    ('', 'id="site-search"'),
    ('assets/topic-catalog.js', 'window.KV_TOPIC_CATALOG'),
    ('math/topics/addition/index.html', '<title>10以内加减法</title>'),
    ('physics/middle/motion.html', '<title>机械运动 · 初中物理互动可视化</title>'),
    ('chemistry/high/mole-concept.html', '<title>物质的量 · 高中化学互动可视化</title>'),
    ('science/sink-float.html', '<title>沉与浮 · 小学科学互动可视化</title>'),
    ('computer/index.html', '<title>计算机 · 知识可视化学习站</title>'),
    ('ai/index.html', '<title>人工智能 · 知识可视化学习站</title>'),
    ('computer/primary/robot-algorithms.html', '<title>指令小机器人 · 小学计算机</title>'),
    ('ai/high/classifier-lab.html', '<title>分类边界实验室 · 高中人工智能</title>'),
    ('computer-ai/primary/robot-algorithms.html', 'url=../../computer/primary/robot-algorithms.html'),
    ('computer-ai/high/classifier-lab.html', 'url=../../ai/high/classifier-lab.html'),
)
MAX_BYTES = 1024 * 1024


def normalize_base(base, allow_http=False):
    parsed = urlsplit(base)
    if parsed.scheme not in ('http', 'https') or not parsed.hostname or parsed.username or parsed.password or parsed.query or parsed.fragment:
        raise ValueError('base URL must be an HTTP(S) site URL without credentials, query or fragment')
    if parsed.scheme != 'https' and not (allow_http and parsed.hostname in ('127.0.0.1', 'localhost', '::1')):
        raise ValueError('HTTPS is required (HTTP is only allowed for loopback tests)')
    return base.rstrip('/') + '/'


def verify(base, revision, allow_http=False):
    base = normalize_base(base, allow_http)
    if not re.fullmatch(r'[0-9a-f]{40}|[0-9a-f]{64}', revision):
        raise ValueError('expected revision must be a full lowercase Git hash')
    expected = urlsplit(base)

    def read(path):
        url = urljoin(base, path) + '?' + urlencode({'verify': revision})
        request = Request(url, headers={'Cache-Control': 'no-cache', 'User-Agent': 'knowledge-visual-release-check/1'})
        try:
            response = urlopen(request, timeout=10)
        except HTTPError as exc:
            status = exc.code
            exc.close()
            raise ValueError(f'{path or "index"}: HTTP {status}') from exc
        with response:
            final = urlsplit(response.geturl())
            if (final.scheme, final.netloc) != (expected.scheme, expected.netloc) or not final.path.startswith(expected.path):
                raise ValueError(f'{path or "index"}: redirect outside site base')
            data = response.read(MAX_BYTES + 1)
            if len(data) > MAX_BYTES:
                raise ValueError(f'{path or "index"}: response exceeds size limit')
            return data.decode('utf-8')

    def check_version():
        data = json.loads(read('release-version.json'))
        if not isinstance(data, dict) or data.get('schema_version') != 1 or data.get('revision') != revision or data.get('site_files_modified') is not False:
            raise ValueError('release version does not match the expected clean commit')

    check_version()
    for path, marker in CHECKS:
        if marker not in read(path):
            raise ValueError(f'{path or "index"}: expected content not found')
    check_version()
    return len(CHECKS)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base-url', required=True)
    parser.add_argument('--expected-revision', required=True)
    parser.add_argument('--attempts', type=int, default=6)
    parser.add_argument('--delay-seconds', type=float, default=10)
    parser.add_argument('--allow-http-loopback', action='store_true', help='allow HTTP for local tests only')
    args = parser.parse_args()
    if args.attempts < 1 or args.delay_seconds < 0:
        parser.error('attempts must be positive and delay must be non-negative')
    for attempt in range(1, args.attempts + 1):
        try:
            count = verify(args.base_url, args.expected_revision, args.allow_http_loopback)
            print(f'Verified revision {args.expected_revision} and {count} public resources at {args.base_url}')
            return 0
        except (ValueError, OSError, URLError) as exc:
            print(f'Published verification attempt {attempt}/{args.attempts} failed: {exc}', file=sys.stderr)
            if attempt < args.attempts:
                time.sleep(args.delay_seconds)
    return 1


if __name__ == '__main__':
    sys.exit(main())
