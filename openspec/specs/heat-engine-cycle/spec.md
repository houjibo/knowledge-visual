# heat-engine-cycle Specification

## Purpose
TBD - created by archiving change heat-engine-cycle-accuracy. Update Purpose after archive.

## Requirements

### Requirement: 曲轴与四冲程保持一致
简化热机动画 SHALL 在一个四冲程循环中让曲轴同向转动两圈，活塞随冲程上下往复，并说明模型限制。

#### Scenario: 逐冲程观察
- **WHEN** 学习者依次查看吸气、压缩、做功和排气
- **THEN** 气门、活塞方向与能量说明和当前冲程一致，曲柄不在相邻冲程反向回转

### Requirement: 动画速度与暂停状态可见
速度为零时 SHALL 显示停止并停止动画调度，手动跳转 SHALL 暂停并更新当前冲程。

#### Scenario: 零速度时手动跳转
- **WHEN** 学习者将动画速度设为零并跳转冲程
- **THEN** 冲程信息更新，动画保持暂停且不继续请求帧
