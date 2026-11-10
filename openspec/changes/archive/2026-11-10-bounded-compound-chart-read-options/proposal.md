## Why

复式统计图读图练习在两组总量相等时会得到正确答案 0，但现有干扰项去重后可能只剩三个选项。固定随机序列已复现题目只显示 3 个答案，学习者无法获得稳定完整的作答体验。

## What Changes

- 保证复式统计图读图练习中的数值题始终显示四个互异的非负整数选项，且正确答案恰好出现一次。
- 用有限候选补齐重复干扰项，覆盖零差值及其他数值重复场景。
- 添加固定随机条件下的浏览器回归，并同步交互证据、风险清单和差距台账。

## Capabilities

### New Capabilities

- `compound-chart-reading-options`: 规定复式统计图读图练习数值选项的数量、唯一性和正确答案约束。

### Modified Capabilities

无。

## Impact

影响 `math/topics/compound-charts/index.html`、新增的 Playwright 浏览器回归、`package.json` 的浏览器测试列表，以及 `docs/assessments/interaction-evidence.json`、`docs/assessments/interaction-risks.md` 和 `docs/gaps.md`。不改变复式统计图数据、题型或其他模式。
