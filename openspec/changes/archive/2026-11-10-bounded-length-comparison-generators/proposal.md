## Why

“测量长度”的比较练习会在两件物品长度相同时无限重抽另一件物品；重复随机值使换题卡住主线程，学习者无法继续比较练习。需要保证每道比较题都从有限候选中选出长度不同的物品。

## What Changes

- 将相同长度的随机重抽替换为有限的不同长度候选选择。
- 增加可复现初始化和重复随机值浏览器回归，独立核对两条线段长度及正确答案。

## Capabilities

### New Capabilities

- `length-comparison-reliability`: 测量长度比较题的有限生成、长度区分和答题反馈。

### Modified Capabilities

无。

## Impact

- 修改 `math/topics/length-measurement/index.html`。
- 增加并登记浏览器回归，更新交互证据与差距台账。
- 不增加运行时依赖。
