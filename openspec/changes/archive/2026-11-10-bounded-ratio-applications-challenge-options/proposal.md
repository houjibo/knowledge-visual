## Why

“比的应用”挑战在页面初始化时通过拒绝抽样生成三个干扰项；答案为 10 且固定随机值为 0 时，循环永远只能得到 0，页面因此卡住。答题后按钮仍可重复操作，还会重复计分并安排多个下一题。

## What Changes

- 从有限的正整数候选中无放回生成挑战干扰项，保证四个唯一选项和正确答案。
- 每题首次作答后锁定选项，避免重复计分和重复切题。
- 增加固定随机边界、正确/错误作答、后续出题及窄屏的浏览器回归。

## Capabilities

### New Capabilities
- `ratio-applications-challenge-reliability`: 比的应用挑战题目生成、答案、计分和单次作答行为。

### Modified Capabilities

## Impact

- 页面：`math/topics/ratio-applications/index.html`
- 回归：新增浏览器测试并登记到统一测试命令。
- 工程记录：交互证据、风险线索和项目差距清单。
- 不增加外部依赖；失败时可回退本次提交。
