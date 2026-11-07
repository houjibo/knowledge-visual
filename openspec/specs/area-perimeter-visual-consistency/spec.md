# area-perimeter-visual-consistency Specification

## Purpose
TBD - created by archiving change area-perimeter-visual-consistency. Update Purpose after archive.

## Requirements

### Requirement: 图形与计算保持一致
页面 SHALL 以长不小于宽的矩形展示面积和周长，并在参数更新时同步显示完整单位格。

#### Scenario: 调整矩形参数
- **WHEN** 学习者改变长或宽
- **THEN** 宽不大于长，网格数等于面积，周长与边长一致

#### Scenario: 正方形参数边界
- **WHEN** 学习者调整正方形边长
- **THEN** 两个网格均显示边长平方个单位格，面积和周长正确

### Requirement: 控件状态可辨识
页面 SHALL 提供具名滑块及形状选择状态。

#### Scenario: 切换形状
- **WHEN** 学习者选择长方形或正方形
- **THEN** 图形和按钮选中状态同步更新
