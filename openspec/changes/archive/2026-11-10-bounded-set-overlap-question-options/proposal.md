## Why

集合重叠练习和十题挑战共用随机题目生成器；当干扰项反复得到相同值，或正确答案为 0 时，无界补项循环会卡住页面并阻止继续作答。需要让两种模式在重复随机值和零重叠答案下都能有限生成完整选项。

## What Changes

- 用有限的正整数候选替换重叠题的随机重抽选项循环。
- 保留零重叠作为合法答案，并确保四个选项互异且答案唯一。
- 增加练习、挑战、重复随机值和零答案的桌面/移动浏览器回归。

## Capabilities

### New Capabilities

- `set-overlap-question-reliability`: 集合重叠练习和挑战题的有限选项生成与正确作答反馈。

### Modified Capabilities

无。

## Impact

- 修改 `math/topics/set-overlap/index.html`。
- 增加并登记浏览器回归，更新交互证据、风险清单与差距台账。
- 不增加运行时依赖。
