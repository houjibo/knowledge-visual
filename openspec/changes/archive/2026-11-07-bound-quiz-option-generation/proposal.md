## Why

统一检查再次发现搭配中的学问、位置与顺序两个主题在某些随机问题下无法生成足够的不同选项，导致无限循环和页面加载超时。

## What Changes

- 使用有限候选集合生成两个主题的选择题选项，保留正确答案和现有问题。
- 为边界随机输入增加浏览器回归，验证选项数量与页面可用性。

## Capabilities

### New Capabilities

- `bounded-primary-quiz`: 两个小学主题以有限过程生成包含正确答案的选择题。

### Modified Capabilities

无。

## Impact

修改两个小学主题和浏览器测试，不改变学习进度存储或页面路径。
