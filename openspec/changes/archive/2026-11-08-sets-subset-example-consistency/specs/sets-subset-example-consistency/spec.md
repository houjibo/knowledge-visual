## ADDED Requirements

### Requirement: 子集动画与示例一致

子集动画 SHALL 仅绘制 A={1,2}、B={1,2,3,4} 中的元素，且元素位置 SHALL 与集合归属一致。

#### Scenario: 动画完成

- **WHEN** 子集动画展示全部元素
- **THEN** 1、2 位于 A 内，3、4 位于 B 内但 A 外，不出现额外元素

### Requirement: 元素归属可通过键盘探索

元素归属示例 SHALL 允许使用键盘选择数字并反馈是否属于 A。

#### Scenario: 键盘选择数字

- **WHEN** 学习者使用键盘选择 2 或 3
- **THEN** 分别反馈属于或不属于 A
