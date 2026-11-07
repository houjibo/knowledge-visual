# cylinder-cone-learning Specification

## Purpose
TBD - created by archiving change cylinder-cone-learning-correctness. Update Purpose after archive.

## Requirements

### Requirement: 圆柱圆锥题目生成与公式正确
圆柱与圆锥的计算及挑战题 SHALL 有限生成四个不同选项，明确数值题的近似规则和单位；圆锥展开说明 SHALL 正确描述侧面积公式。

#### Scenario: 恒定随机值
- **WHEN** 随机源连续返回相同值
- **THEN** 计算及挑战题均能生成四个不同选项且包含正确答案

#### Scenario: 圆锥侧面积
- **WHEN** 学习者查看圆锥展开图
- **THEN** 页面说明侧面积为 πrl，并标明 r 与 l 的含义

#### Scenario: 数值题单位
- **WHEN** 学习者查看面积或体积的挑战选项
- **THEN** 选项分别显示平方厘米或立方厘米
