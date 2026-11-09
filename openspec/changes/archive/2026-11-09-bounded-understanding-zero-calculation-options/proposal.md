## Why

“认识0”页面在初始化时立即生成运算题，选项通过无界随机重抽补齐；固定随机源会不断返回重复选项，导致主线程卡住并阻止整页学习内容加载。为保证这一小学数学可视化页面在任意重复随机值下仍可进入和继续练习，需要给选项生成明确的有限边界。

## What Changes

- 为 0 的加、减、乘练习生成四个互异的整数选项，范围保持在 0 到 10。
- 增加固定随机边界、题意答案校验、答题反馈计分、下一题和窄屏回归。
- 更新交互证据、风险索引与差距台账。

## Capabilities

### New Capabilities

- `bounded-understanding-zero-calculation-options`: “认识0”运算练习在重复随机源下有限生成选项并保持唯一答案。

### Modified Capabilities

无。

## Impact

- 修改 `math/topics/understanding-zero/index.html`。
- 新增 Playwright 浏览器回归并登记到统一测试命令。
- 更新交互证据、覆盖/风险索引和 `docs/gaps.md`。
- 不增加依赖，不改变题型、正确答案、反馈和计分规则。
