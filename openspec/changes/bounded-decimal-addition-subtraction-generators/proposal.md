## Why

十进制加减页面的应用题会在随机值重复时无限重抽不同物品，挑战题的补选项循环也可能重复抽到同一个答案，导致页面加载或换题卡住。学习者需要在重复随机值和边界答案下仍能及时看到完整、唯一的题目选项。

## What Changes

- 以有限索引选取两个不同的应用题物品。
- 将应用题和挑战题的干扰项补齐改为有限候选生成，并按数值去重。
- 增加固定随机值覆盖页面初始化、应用题及全部挑战题型的浏览器回归。

## Capabilities

### New Capabilities

- `decimal-addition-subtraction-reliability`: 十进制加减页面的应用题与挑战选项有限生成和唯一答案行为。

### Modified Capabilities

无。

## Impact

- 修改 `math/topics/decimal-addition-subtraction/index.html`。
- 增加并登记浏览器回归，更新交互证据与差距台账。
- 不增加运行时依赖。
