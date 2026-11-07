# triangle-classification-practice-accuracy Specification

## Purpose
TBD - created by archiving change triangle-classification-practice-accuracy. Update Purpose after archive.

## Requirements

### Requirement: 三角形分类图与几何性质一致
分类图 SHALL 体现对应角或边的几何性质，并清楚区分最具体的边分类。

#### Scenario: 查看钝角三角形
- **WHEN** 学习者查看钝角三角形示例
- **THEN** 图形存在一个大于 90° 的内角

### Requirement: 第三边范围条件明确
第三边范围题 SHALL 明确整数厘米及包含端点的范围，并提供唯一正确的完整范围。

#### Scenario: 两边均为三厘米
- **WHEN** 学习者求第三边所有可能的整数厘米长度
- **THEN** 正确范围为 1 至 5 厘米

### Requirement: 挑战题有限生成并保留反馈
练习 SHALL 在随机值重复时有限生成选项，作答后锁定并等待主动换题。

#### Scenario: 等腰三角形底角为六十度
- **WHEN** 选项候选发生重复
- **THEN** 页面仍提供四个不同选项及唯一正确答案
