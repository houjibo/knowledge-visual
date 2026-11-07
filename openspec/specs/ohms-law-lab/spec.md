# ohms-law-lab Specification

## Purpose
TBD - created by archiving change ohms-law-circuit-accuracy. Update Purpose after archive.

## Requirements

### Requirement: 理想电路与计算一致
实验 SHALL 用理想电源和单一电阻表示 I = U / R，电流表串联，电压表并联在电阻两端，并说明模型条件。

#### Scenario: 改变电压和电阻
- **WHEN** 学习者操作电压或电阻滑块
- **THEN** 电路读数、图线上工作点和电流计算保持一致

### Requirement: 记录状态可见
实验 SHALL 明确显示八组记录的上限，并在达到上限后禁用记录直至清空。

#### Scenario: 记录达到上限
- **WHEN** 学习者记录八组数据
- **THEN** 页面提示上限，清空后可再次记录
