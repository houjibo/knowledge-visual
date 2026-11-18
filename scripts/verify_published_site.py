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
    ('physics/middle/mass-density.html', '<title>质量与密度 · 初中物理互动可视化</title>'),
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
    ('simulation-world/cam-factory.html', '<title>凸轮送料与工厂节拍模拟 · 模拟世界</title>'),
    ('simulation-world/assets/cam-factory-model.js', 'root.CamFactoryModel'),
    ('simulation-world/assets/cam-factory.js', 'window.CamFactoryModel'),
    ('simulation-world/line-shaft-workshop.html', '<title>共享传动轴工坊模拟 · 模拟世界</title>'),
    ('simulation-world/assets/line-shaft-model.js', 'root.LineShaftModel'),
    ('simulation-world/assets/line-shaft-workshop.js', 'window.LineShaftModel'),
    ('simulation-world/steam-engine.html', '<title>单缸蒸汽机动力路径模拟 · 模拟世界</title>'),
    ('simulation-world/assets/steam-engine-model.js', 'root.SteamEngineModel'),
    ('simulation-world/assets/steam-engine.js', 'window.SteamEngineModel'),
    ('assets/vendor/three-r128/three.min.js', 'THREE'),
    ('assets/vendor/three-r128/OrbitControls.js', 'OrbitControls'),
    ('assets/vendor/three-r128/CSS2DRenderer.js', 'CSS2DRenderer'),
    ('assets/vendor/three-r128/LICENSE', 'MIT License'),
    ('ai/primary/index.html', '<title>小学人工智能 · 知识可视化学习站</title>'),
    ('ai/primary/feature-classification-lab.html', '<title>特征线索分类实验室 · 小学人工智能</title>'),
    ('ai/middle/index.html', '<title>初中人工智能 · 知识可视化学习站</title>'),
    ('ai/middle/data-label-quality.html', '<title>数据标签侦察实验室 · 初中人工智能</title>'),
    ('ai/middle/data-source-coverage.html', '<title>数据来源与覆盖实验室 · 初中人工智能</title>'),
    ('ai/middle/rule-learned-comparison.html', '<title>手写规则与学习阈值 · 初中人工智能</title>'),
    ('ai/middle/assets/rule-learned-model.js', 'root.KVRuleLearnedModel'),
    ('ai/middle/assets/rule-learned.js', 'window.KVRuleLearnedModel'),
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
    ('computer/middle/message-transfer.html', '<title>消息传输实验室 · 初中计算机</title>'),
    ('computer/middle/assets/message-transfer-model.js', 'TextEncoder'),
    ('computer/middle/assets/message-transfer.js', 'window.MessageTransferModel'),
    ('computer/middle/local-backup-restore.html', '<title>备份与恢复实验室 · 初中计算机</title>'),
    ('computer/middle/assets/local-backup-model.js', 'root.KVLocalBackupModel'),
    ('computer/middle/assets/local-backup.js', 'window.KVLocalBackupModel'),
    ('computer/middle/identity-encryption.html', '<title>身份与保密实验室 · 初中计算机</title>'),
    ('computer/middle/assets/identity-encryption-model.js', 'root.KVIdentityEncryptionModel'),
    ('computer/middle/assets/identity-encryption.js', 'window.KVIdentityEncryptionModel'),
    ('computer/middle/iot-sensor-feedback.html', '<title>传感与控制实验室 · 初中计算机</title>'),
    ('computer/middle/assets/iot-sensor-feedback-model.js', 'root.IotSensorFeedbackModel'),
    ('computer/middle/assets/iot-sensor-feedback.js', 'window.IotSensorFeedbackModel'),
    ('computer/middle/iot-internet-distinction.html', '<title>物联网与互联网辨析实验室 · 初中计算机</title>'),
    ('computer/middle/assets/iot-internet-distinction-model.js', 'root.IotInternetDistinctionModel'),
    ('computer/middle/assets/iot-internet-distinction.js', 'window.IotInternetDistinctionModel'),
    ('computer/middle/iot-device-identity.html', '<title>物联设备数字身份与隐私实验室 · 初中计算机</title>'),
    ('computer/middle/assets/iot-device-identity-model.js', 'root.IotDeviceIdentityModel'),
    ('computer/middle/assets/iot-device-identity.js', 'window.IotDeviceIdentityModel'),
    ('computer/middle/network-paths.html', '<title>数据包路径实验室 · 初中计算机</title>'),
    ('computer/middle/assets/network-path-model.js', 'root.NetworkPathModel'),
    ('computer/middle/assets/network-paths.js', 'window.NetworkPathModel'),
    ('computer/high/index.html', '<title>高中计算机 · 知识可视化学习站</title>'),
    ('computer/high/data-workbench.html', '<title>数据编码与分析工作台 · 高中计算机</title>'),
    ('computer/high/assets/data-workbench-model.js', 'root.DataWorkbenchModel'),
    ('computer/high/assets/data-workbench.js', 'window.DataWorkbenchModel'),
    ('computer/high/information-system.html', '<title>图书借阅信息系统工作台 · 高中计算机</title>'),
    ('computer/high/assets/information-system-model.js', 'root.InformationSystemModel'),
    ('computer/high/assets/information-system.js', 'window.InformationSystemModel'),
    ('computer/high/ai-system-dialogue.html', '<title>信息系统对话交互实验室 · 高中计算机</title>'),
    ('computer/high/assets/ai-system-dialogue-model.js', 'root.HighAiSystemDialogueModel'),
    ('computer/high/assets/ai-system-dialogue.js', 'window.HighAiSystemDialogueModel'),
    ('computer/high/genai-responsible-use.html', '<title>生成式 AI 负责任使用实验室 · 高中计算机</title>'),
    ('computer/high/assets/genai-responsible-use-model.js', 'root.HighGenaiResponsibleUseModel'),
    ('computer/high/assets/genai-responsible-use.js', 'window.HighGenaiResponsibleUseModel'),
    ('computer/high/responsible-publishing.html', '<title>负责任发布与传播实验室 · 高中计算机</title>'),
    ('computer/high/assets/responsible-publishing-model.js', 'root.HighResponsiblePublishingModel'),
    ('computer/high/assets/responsible-publishing.js', 'window.HighResponsiblePublishingModel'),
    ('computer/high/device-platform-choice.html', '<title>设备与平台选择实验室 · 高中计算机</title>'),
    ('computer/high/assets/device-platform-choice-model.js', 'root.HighDevicePlatformChoiceModel'),
    ('computer/high/assets/device-platform-choice.js', 'window.HighDevicePlatformChoiceModel'),
    ('computer/high/search-strategies.html', '<title>查找策略对照实验室 · 高中计算机</title>'),
    ('computer/high/assets/search-strategies-model.js', 'root.SearchStrategiesModel'),
    ('computer/high/assets/search-strategies.js', 'window.SearchStrategiesModel'),
    ('computer/high/algorithm-flowchart.html', '<title>算法描述与流程图实验室 · 高中计算机</title>'),
    ('computer/high/assets/algorithm-flowchart-model.js', 'root.HighAlgorithmFlowchartModel'),
    ('computer/high/assets/algorithm-flowchart.js', 'window.HighAlgorithmFlowchartModel'),
    ('computer/high/gcd-algorithm.html', '<title>最大公约数算法工作台 · 高中计算机</title>'),
    ('computer/high/assets/gcd-algorithm-model.js', 'root.HighGcdAlgorithmModel'),
    ('computer/high/assets/gcd-algorithm.js', 'window.HighGcdAlgorithmModel'),
    ('computer/high/iot-feedback-control.html', '<title>物联网反馈控制实验室 · 高中计算机</title>'),
    ('computer/high/assets/iot-feedback-control-model.js', 'root.HighIotFeedbackControlModel'),
    ('computer/high/assets/iot-feedback-control.js', 'window.HighIotFeedbackControlModel'),
    ('computer/uni/index.html', '<title>大学计算机 · 知识可视化学习站</title>'),
    ('computer/uni/stack-queue.html', '<title>栈与队列对照实验室 · 大学计算机</title>'),
    ('computer/uni/assets/stack-queue-model.js', 'root.StackQueueModel'),
    ('computer/uni/assets/stack-queue.js', 'window.StackQueueModel'),
    ('ai/high/classifier-lab.html', '<title>分类边界实验室 · 高中人工智能</title>'),
    ('ai/high/train-test-generalization.html', '<title>训练与测试集实验室 · 高中人工智能</title>'),
    ('ai/high/threshold-errors.html', '<title>分类阈值与误报漏报实验室 · 高中人工智能</title>'),
    ('ai/high/assets/threshold-errors-model.js', 'root.ThresholdErrorsModel'),
    ('ai/high/assets/threshold-errors.js', 'window.ThresholdErrorsModel'),
    ('chemistry/high/organic.html', 'role="tablist" aria-label="有机化学学习主题"'),
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
