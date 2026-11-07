# subject-progress Specification

## Purpose
使学习者在首页看到各学科已记录的学习进度，并确保来自不同学段独立存储的同名主题不会被误认为同一条记录。

## Requirements

### Requirement: 独立学段记录累计
首页学科进度 SHALL 分别累计该学科各独立存储中的完成记录，即使不同存储存在同名主题也分别计数。

#### Scenario: 跨学段同名物理主题
- **WHEN** 初中和高中物理的独立进度存储均记录 motion 已完成
- **THEN** 首页物理卡片显示已学 2/55

#### Scenario: 尚无记录
- **WHEN** 某学科的进度存储均为空
- **THEN** 该学科卡片显示尚未开始
