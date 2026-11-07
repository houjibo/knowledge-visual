# correspondence-learning Specification

## Purpose
TBD - created by archiving change correspondence-visual-reliability. Update Purpose after archive.

## Requirements

### Requirement: 一一对应图形与数量一致
一一对应练习 SHALL 将每个对象完整显示为一个图形，数量与文字一致；练习、配对游戏和挑战 SHALL 在重复随机值下有限生成题目。

#### Scenario: 表情与数量
- **WHEN** 练习展示两组对象
- **THEN** 每组完整图形的数量与标签一致，学习者可以比较并获得反馈

#### Scenario: 随机值重复
- **WHEN** 随机源持续返回同一个值
- **THEN** 三种题目仍能生成，数值选择题提供四个不同选项

#### Scenario: 作答后锁定
- **WHEN** 学习者回答一道题
- **THEN** 本题选项禁用，不会通过键盘重复计分
