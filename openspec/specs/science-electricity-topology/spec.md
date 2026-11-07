# science-electricity-topology Specification

## Purpose
TBD - created by archiving change science-electricity-topology. Update Purpose after archive.

## Requirements

### Requirement: 电路图连接与元件一致
系统 SHALL 将电池、开关和灯泡接入导线回路，不得画出绕过灯泡的直接导线。

#### Scenario: 简单电路
- **WHEN** 检查示意图的元件端点
- **THEN** 电池两端仅在开关闭合且灯泡接入时连通

#### Scenario: 并联电路
- **WHEN** 两个灯泡分别接入不同支路
- **THEN** 单独移除任一灯泡仍有另一条支路，移除两个灯泡后电池两端不再经导线连通

### Requirement: 条件及交互可理解
系统 SHALL 说明亮度比较的理想条件，并提供键盘操作、动画暂停和可访问状态。

#### Scenario: 暂停并操作
- **WHEN** 学习者暂停动画后切换开关或电路类型
- **THEN** 图示和状态描述更新，动画保持暂停
