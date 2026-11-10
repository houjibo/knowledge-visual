# random-variable-distribution Specification

## Purpose
本规格规范固定坐标比较正态密度；超几何参数和解释一致，核心边界为：正态分布图必须在改变标准差时维持坐标比例，以显示密度曲线宽高变化，并说明阴影概率。

## Requirements

### Requirement: 固定坐标比较正态密度
正态分布图 SHALL 在改变标准差时维持坐标比例，以显示密度曲线宽高变化，并说明阴影概率。

#### Scenario: 增大标准差
- **WHEN** 学习者将标准差从 0.5 改为 3
- **THEN** 曲线在相同坐标上变宽、峰值降低，±σ 阴影仍表示约 68.27%

### Requirement: 超几何参数和解释一致
不放回抽样的样本数 SHALL 不超过总体数，显示值 SHALL 与分布计算一致。

#### Scenario: 从较大的二项样本数切换
- **WHEN** 学习者设置 n=30 后选择总体数为 20 的超几何分布
- **THEN** 滑块和计算均使用 n=20
