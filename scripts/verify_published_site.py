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
    ('chemistry/high/nonmetals.html', '<title>非金属及其化合物 · 互动可视化</title>'),
    ('science/sink-float.html', '<title>沉与浮 · 小学科学互动可视化</title>'),
    ('computer/index.html', '<title>计算机 · 知识可视化学习站</title>'),
    ('ai/index.html', '<title>人工智能 · 知识可视化学习站</title>'),
    ('simulation-world/index.html', '<title>模拟世界 · 知识可视化学习站</title>'),
    ('simulation-world/solar-system.html', '<title>太阳系模拟 · 模拟世界</title>'),
    ('simulation-world/gear-transmission.html', '<title>齿轮传动模拟 · 模拟世界</title>'),
    ('simulation-world/belt-pulley.html', '<title>皮带与带轮模拟 · 模拟世界</title>'),
    ('simulation-world/assets/belt-pulley-model.js', 'root.BeltPulleyModel'),
    ('simulation-world/assets/belt-pulley.js', 'window.BeltPulleyModel'),
    ('simulation-world/slider-crank.html', '<title>曲柄滑块模拟 · 模拟世界</title>'),
    ('simulation-world/assets/slider-crank-model.js', 'root.SliderCrankModel'),
    ('simulation-world/assets/slider-crank.js', 'window.SliderCrankModel'),
    ('simulation-world/robot-arm.html', '<title>二维机械臂模拟 · 模拟世界</title>'),
    ('simulation-world/assets/robot-arm-model.js', 'root.RobotArmModel'),
    ('simulation-world/assets/robot-arm.js', 'window.RobotArmModel'),
    ('simulation-world/assembly-line.html', '<title>工业流水线模拟 · 模拟世界</title>'),
    ('simulation-world/assets/assembly-line-model.js', 'root.AssemblyLineModel'),
    ('simulation-world/assets/assembly-line.js', 'window.AssemblyLineModel'),
    ('simulation-world/warehouse-sort.html', '<title>仓储分拣模拟 · 模拟世界</title>'),
    ('simulation-world/assets/warehouse-sort-model.js', 'root.WarehouseSortModel'),
    ('simulation-world/assets/warehouse-sort.js', 'window.WarehouseSortModel'),
    ('assets/vendor/three-r128/three.min.js', 'THREE'),
    ('assets/vendor/three-r128/OrbitControls.js', 'OrbitControls'),
    ('assets/vendor/three-r128/CSS2DRenderer.js', 'CSS2DRenderer'),
    ('assets/vendor/three-r128/LICENSE', 'MIT License'),
    ('ai/primary/index.html', '<title>小学人工智能 · 知识可视化学习站</title>'),
    ('ai/primary/feature-classification-lab.html', '<title>特征线索分类实验室 · 小学人工智能</title>'),
    ('ai/middle/index.html', '<title>初中人工智能 · 知识可视化学习站</title>'),
    ('ai/middle/data-label-quality.html', '<title>数据标签侦察实验室 · 初中人工智能</title>'),
    ('ai/middle/data-source-coverage.html', '<title>数据来源与覆盖实验室 · 初中人工智能</title>'),
    ('ai/middle/output-verification.html', '<title>回答核验实验室 · 初中人工智能</title>'),
    ('ai/middle/data-minimization.html', '<title>信息最小化实验室 · 初中人工智能</title>'),
    ('computer/primary/robot-algorithms.html', '<title>指令小机器人 · 小学计算机</title>'),
    ('computer/primary/repeat-loops.html', '<title>循环指令工坊 · 小学计算机</title>'),
    ('computer/primary/conditional-robot.html', '<title>条件分支机器人 · 小学计算机</title>'),
    ('computer/primary/assets/condition-robot-model.js', 'root.ConditionRobotModel'),
    ('computer/primary/assets/condition-robot.js', 'window.ConditionRobotModel'),
    ('computer/primary/sequential-search.html', '<title>顺序查找实验室 · 小学计算机</title>'),
    ('computer/primary/assets/sequential-search-model.js', 'root.SequentialSearchModel'),
    ('computer/primary/assets/sequential-search.js', 'window.SequentialSearchModel'),
    ('computer/primary/adjacent-swap-sort.html', '<title>相邻交换排序实验室 · 小学计算机</title>'),
    ('computer/primary/assets/adjacent-swap-sort-model.js', 'root.AdjacentSwapSortModel'),
    ('computer/primary/assets/adjacent-swap-sort.js', 'window.AdjacentSwapSortModel'),
    ('computer/high/index.html', '<title>高中计算机 · 知识可视化学习站</title>'),
    ('computer/high/search-strategies.html', '<title>查找策略对照实验室 · 高中计算机</title>'),
    ('computer/high/assets/search-strategies-model.js', 'root.SearchStrategiesModel'),
    ('computer/high/assets/search-strategies.js', 'window.SearchStrategiesModel'),
    ('computer/uni/index.html', '<title>大学计算机 · 知识可视化学习站</title>'),
    ('computer/uni/stack-queue.html', '<title>栈与队列对照实验室 · 大学计算机</title>'),
    ('computer/uni/assets/stack-queue-model.js', 'root.StackQueueModel'),
    ('computer/uni/assets/stack-queue.js', 'window.StackQueueModel'),
    ('ai/high/classifier-lab.html', '<title>分类边界实验室 · 高中人工智能</title>'),
    ('ai/high/train-test-generalization.html', '<title>训练与测试集实验室 · 高中人工智能</title>'),
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
