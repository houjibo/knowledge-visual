# fraction-operations-learning Specification

## Purpose
TBD - created by archiving change fraction-operations-reliability. Update Purpose after archive.

## Requirements

### Requirement: 题面与答案一致
自由练习的减法 SHALL 在需要时交换整个分数，计算并接受显示题目的正确答案。

#### Scenario: 较小分数先出现
- **WHEN** 生成 1/2 减 2/3 的练习
- **THEN** 显示 2/3 减 1/2 并接受 1/6

### Requirement: 有限生成与可重试闯关
系统 SHALL 使用有限候选生成不同分母和选项，完成闯关后允许重新开始。

#### Scenario: 固定随机值完成闯关
- **WHEN** 随机值固定且学习者答对五关并选择再来一次
- **THEN** 每关正常生成且重新显示第一关
