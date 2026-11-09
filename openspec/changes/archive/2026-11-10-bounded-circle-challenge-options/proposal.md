## Why

“圆”的挑战题会先删除重复选项，再用随机偏移循环补足四个答案。直径为 2 的面积题会留下三个选项；若后续固定随机值仍生成正确答案，挑战初始化便会卡住页面。现需保证所有题型都从有限候选中完成选项生成。

## What Changes

- 用有限且互异的干扰项候选补足圆挑战题的答案选项。
- 保证每题恰有四个不同选项，正确答案只出现一次。
- 增加可复现卡死序列及五类题型的浏览器回归。

## Capabilities

### New Capabilities

- `circle-challenge-reliability`: 圆挑战题目的有限选项生成、正确答案和答题推进。

### Modified Capabilities

无。

## Impact

- 修改 `math/topics/circle/index.html`。
- 增加并登记浏览器回归，更新交互证据与差距台账。
- 不增加运行时依赖。
