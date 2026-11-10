# cylinder-cone-net-proportions Specification

## Purpose
本规格规范展开图与底面按同一比例绘制，核心边界为：页面必须使圆柱侧面长方形的长和圆锥侧面扇形的弧长分别等于底面周长。

## Requirements

### Requirement: 展开图与底面按同一比例绘制
页面 SHALL 使圆柱侧面长方形的长和圆锥侧面扇形的弧长分别等于底面周长。

#### Scenario: 查看圆柱展开图
- **WHEN** 学习者选择圆柱展开图
- **THEN** 长方形的长等于 2πr，画布说明和选中状态同步更新

#### Scenario: 查看圆锥展开图
- **WHEN** 学习者选择圆锥展开图
- **THEN** 扇形的弧长等于 2πr，扇形半径等于母线长度
