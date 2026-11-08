## Why

初中《电流和电路》把短路电流写成无条件“极大”，但页面同时声明忽略导线与电源内阻，容易让学习者把理想模型误当成实际电流预测。短路是低阻通路，电流大小仍受电源、线路和保护条件影响；页面需要把这一因果关系与安全边界讲清楚。

## What Changes

- 将短路解释限定为低阻通路，并说明电流可能增大、线路或电源可能过热，同时标出实际电流取决于未建模条件。
- 为短路原因和后果增加可键盘展开的因果示意，明确它不是实际接线或实验指导。
- 为该示意补充桌面、窄屏、键盘和可访问文本回归，并更新相关差距及交互证据。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `current-circuit-topology`：增加短路机理、理想模型边界及可访问学习说明的要求。

## Impact

- 影响 `physics/middle/current-circuits.html` 的概念说明与样式。
- 扩展 `tests/browser/current-circuit-topology.spec.js`，并更新 `openspec` 行为契约、交互证据索引和 `docs/gaps.md`。
- 不改变电路数值模型、既有页面地址、共享脚本或发布依赖。
