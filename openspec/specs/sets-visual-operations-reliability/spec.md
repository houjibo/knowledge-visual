# sets-visual-operations-reliability Specification

## Purpose
TBD - created by archiving change sets-visual-operations-reliability. Update Purpose after archive.

## Requirements

### Requirement: 集合交集与互动结果一致

集合交集示意 SHALL 仅高亮两集合的重叠区域；互动元素 SHALL 可键盘选择，元素改变后 SHALL 更新当前运算结果。

#### Scenario: 交集示意

- **WHEN** 查看 A∩B 图示
- **THEN** 两圆共同区域被高亮，单独属于 A 或 B 的区域不被高亮

#### Scenario: 修改集合元素

- **WHEN** 学习者选择运算后用键盘或指针改变 A 或 B 的元素
- **THEN** 当前结果立即更新，元素选中状态和焦点保持可辨识
