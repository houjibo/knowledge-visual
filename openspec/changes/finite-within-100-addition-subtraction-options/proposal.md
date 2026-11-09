## Why

“100 以内加减法”的限时挑战通过随机重抽生成干扰项；随机值持续不变时，循环会反复生成同一选项并阻塞挑战。该风险由全站静态线索盘点发现，需要用固定随机值复现并保证学习者能开始和继续挑战。

## What Changes

- 将挑战干扰项改为有限候选生成，避免重复随机值造成主线程卡住。
- 为固定随机边界下的页面加载、选项唯一性、答案、计分、下一题和窄屏布局增加桌面与移动回归。
- 更新交互证据、覆盖/风险索引和差距记录。

## Capabilities

### New Capabilities

- `within-100-addition-subtraction-finite-options`: 100 以内加减法挑战有限生成唯一选项。

### Modified Capabilities

无。

## Impact

- 修改 `math/topics/addition-subtraction-within-100/index.html`。
- 新增并注册 Playwright 浏览器回归；更新交互证据、风险与覆盖索引及 `docs/gaps.md`。
- 不增加依赖，不改变题目范围、计时、计分和学习进度行为。
