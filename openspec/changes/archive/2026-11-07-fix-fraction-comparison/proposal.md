## Why

小学分数比较题在分母为 2 时要求抽取不同的真分子，但只有 1 可选，导致页面偶发无限循环；比较按钮类名与事件选择器不一致，答题无反馈。

## What Changes

- 允许生成相等的同分母真分数，使用有限次数生成题目。
- 将比较按钮绑定到实际控件，验证相等选项可得分。

## Capabilities

### New Capabilities

- `fraction-comparison`: 小学分数主题的比较练习可以有限生成并反馈正确答案。

### Modified Capabilities

无。

## Impact

仅影响小学分数主题及浏览器回归，不改变现有进度格式或其他页面。
