# derivative-extrema-and-monotonicity Specification

## Purpose
TBD - created by archiving change derivative-extrema-and-monotonicity. Update Purpose after archive.

## Requirements

### Requirement: 极值及增减色带与函数一致

导数页面 SHALL 显示内置函数在指定范围内的局部极值，并在可见画布中按导数符号显示增减色带；图中标记与文字 SHALL 使用相同数据。

#### Scenario: x² 和 x³

- **WHEN** 查看 x² 的函数分析
- **THEN** 显示局部极小值 (0, 0) 和左右递减、递增色带；x³ 在零处没有极值

#### Scenario: 三次函数与正弦函数

- **WHEN** 查看 x³−3x 或 sin(x) 的函数分析
- **THEN** 标记范围内正确的局部极值并与文字一致，明确列表范围
