# animal-classification-exceptions Specification

## Purpose
本规格规范动物类群示意包括典型例外，核心边界为：页面必须区分动物类群的常见特征与典型例外，并提供可通过键盘选择和文字阅读的类群信息。

## Requirements

### Requirement: 动物类群示意包括典型例外
页面 SHALL 区分动物类群的常见特征与典型例外，并提供可通过键盘选择和文字阅读的类群信息。

#### Scenario: 查看哺乳动物
- **WHEN** 学习者选择哺乳动物
- **THEN** 页面说明多数胎生，以及产卵的鸭嘴兽仍是哺乳动物

#### Scenario: 查看爬行动物
- **WHEN** 学习者使用键盘选择爬行动物
- **THEN** 页面同步按钮状态、文字及画布替代标签，并说明卵壳和繁殖方式的多样性
