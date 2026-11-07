# volume-layer-exploration Specification

## Purpose
TBD - created by archiving change volume-layer-exploration. Update Purpose after archive.

## Requirements

### Requirement: 学习者可以逐层累计体积
页面 SHALL 根据长、宽、高展示各层方块并允许逐层计数和重置。

#### Scenario: 逐层计数
- **WHEN** 学习者计入下一层
- **THEN** 已计层高亮，累计体积等于长乘宽乘已计层数，全部计入后不能超出高度

#### Scenario: 参数变化
- **WHEN** 学习者选择预设或调整自由参数
- **THEN** 方块和总量与新参数一致，累计层数重置为零
