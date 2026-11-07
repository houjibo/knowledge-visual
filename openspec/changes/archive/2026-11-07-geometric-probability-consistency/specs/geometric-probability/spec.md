## ADDED Requirements

### Requirement: 线段采样与区间范围一致
线段模拟 SHALL 保持 0≤a<b≤L，并在 L 改变时清除原采样点；改变 a、b SHALL 重新统计已有采样点。

#### Scenario: 缩短线段
- **WHEN** 学习者将长度从 8 改为 4 且原区间起点为 7
- **THEN** 两端点调整至有效范围，旧点清除，概率非负

### Requirement: π 估算可完整重置
蒙特卡洛模拟 SHALL 在重置时清除采样、估算和相对误差。

#### Scenario: 有样本后重置
- **WHEN** 学习者撒点并重置
- **THEN** 点数归零，估算和误差显示空值
