## Why

“认识线段”页面加载时会生成第一道数线段题。选项生成器靠随机重抽补齐三个干扰项；固定随机值会反复得到同一个无效候选，使主线程永久循环并阻塞整页。

## What Changes

- 用有限的正整数邻近候选替换随机重抽，保留四种题目的答案和四选一形式。
- 增加固定随机边界、选项唯一、数图独立校验、答题计分和下一题回归。
- 更新交互证据、风险和差距索引。

## Capabilities

### New Capabilities

- `line-segment-count-options`: 数线段练习在不同随机值下都生成有限且唯一的正整数选项。

### Modified Capabilities

无。

## Impact

- 修改 `math/topics/line-segments/index.html`。
- 新增 Playwright 浏览器回归并登记到统一测试命令。
- 更新交互证据、覆盖/风险索引与 `docs/gaps.md`。
- 不增加依赖，不改变图形、答案、计分或反馈规则。
