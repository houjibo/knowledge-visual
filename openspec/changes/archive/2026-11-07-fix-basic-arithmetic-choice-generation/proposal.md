## Why

全站浏览器冒烟再次发现除法和数的组成页面在小数字题目下要求从不足四个候选值中随机抽取四个不同答案，导致页面无法加载。

## What Changes

- 为两个主题使用有限候选集生成不同选项，并保留正确答案。
- 添加固定随机输入的真实浏览器回归，验证边界题目可以作答。

## Capabilities

### New Capabilities

- `basic-arithmetic-choices`: 基础除法与数的组成练习有限生成可作答的选项。

### Modified Capabilities

无。

## Impact

修改两个小学主题及浏览器测试，不影响现有主题 URL 或学习记录。
