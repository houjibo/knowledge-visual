# 提案

## Why

“认识平面图形”页面在初始化时会立即生成“找图形”和“猜图形”练习。两个生成器都用无界随机重抽排除重复形状；当随机源重复返回同一值时，脚本无法结束，整页无法完成加载。

## What Changes

- 让两个练习生成器只从有限候选集合构造题目，不依赖随机值多样性。
- 保留找图形题的图形数、目标图形选择及至少一个非目标图形。
- 保留猜图形题的题意，并生成四个互异选项且包含正确答案。
- 增加固定随机边界、独立答案核验、下一题和 320px 桌面/移动浏览器回归。
- 更新交互证据、风险线索与差距记录，并通过完整项目检查和 Pages 发布验证。

## Capabilities

### New Capabilities

- `bounded-plane-shapes-generators`: 平面图形两种随机练习在重复随机源下有限生成且保持答案完整。

### Modified Capabilities

无。

## Impact

- 修改 `math/topics/plane-shapes/index.html`。
- 新增 `tests/browser/plane-shapes-bounded-generators.spec.js` 并登记到统一浏览器测试命令。
- 更新交互证据、覆盖/风险索引和 `docs/gaps.md`。
- 不增加依赖，不改变其他模式、反馈文案、计分或进度格式。
