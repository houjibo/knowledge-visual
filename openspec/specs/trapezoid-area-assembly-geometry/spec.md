# trapezoid-area-assembly-geometry Specification

## Purpose
TBD - created by archiving change trapezoid-area-assembly-geometry. Update Purpose after archive.

## Requirements

### Requirement: 梯形拼图保持几何对应
页面 SHALL 展示两个全等梯形通过旋转拼成的平行四边形，拼成图形的底为梯形两底之和，高相同。

#### Scenario: 查看故事与探索拼图
- **WHEN** 学习者查看拼图或调整探索参数
- **THEN** 两个梯形共享一条斜边，面积相等且外轮廓是平行四边形

#### Scenario: 调整到边界
- **WHEN** 参数调整到允许范围的边界
- **THEN** 上底短于下底，图形保持在视窗中，面积数值与参数一致
