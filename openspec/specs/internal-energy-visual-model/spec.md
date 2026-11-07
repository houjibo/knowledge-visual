# internal-energy-visual-model Specification

## Purpose
TBD - created by archiving change internal-energy-visual-model. Update Purpose after archive.

## Requirements

### Requirement: 比热容温升图与模型一致
温升示意 SHALL 使用共同且覆盖模型范围的刻度，并说明相同质量、相同吸热功率和恒定比热容等假设。

#### Scenario: 调整累计加热时间
- **WHEN** 学习者选择 0 或 10 分钟
- **THEN** 零分钟不显示加热火焰，十分钟时两只温度计的高度与显示温升成比例

### Requirement: 气体运动与扩散明确区分
粒子动画 SHALL 说明其为同种理想气体运动示意，未模拟粒子间碰撞或扩散；动画 SHALL 可暂停。

#### Scenario: 暂停并切换演示
- **WHEN** 学习者暂停并切换到比热容后返回
- **THEN** 粒子动画保持暂停，参数仍可调整
