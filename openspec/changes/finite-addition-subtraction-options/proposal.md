## Why

“万以内加减法”的选择挑战和估算练习通过 `while` 随机重抽补齐四个选项。固定随机值会反复命中相同结果；估算答案与精确答案相同时，初始集合甚至只有一项，练习无法完成初始化。

## What Changes

- 将选择挑战与估算练习改为从有限整数候选集合生成唯一选项。
- 保留估算题的近似答案为唯一正确选项，并在近似答案与精确答案不同时保留精确值作为干扰项。
- 增加桌面、移动、固定随机边界及 320px 选项布局回归，验证选项、答案、计分和继续作答。

## Capabilities

### New Capabilities

- `within-10000-addition-subtraction-finite-options`: 万以内加减法选择挑战和估算练习有限生成选项。

### Modified Capabilities

无。

## Impact

- 修改 `math/topics/addition-subtraction-within-10000/index.html`。
- 新增并注册浏览器回归，更新交互证据、覆盖索引、风险线索和差距清单。
- 不增加依赖，不改变算式范围、挑战计分或估算规则。
