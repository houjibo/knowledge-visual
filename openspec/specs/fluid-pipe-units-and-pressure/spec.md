# fluid-pipe-units-and-pressure Specification

## Purpose
TBD - created by archiving change fluid-pipe-units-and-pressure. Update Purpose after archive.

## Requirements

### Requirement: 管径和流量单位一致
页面 SHALL 将入口及出口半径以毫米标示，并使用换算后的截面积计算连续流量与水平理想流动的压力差。

#### Scenario: 收缩或扩张
- **WHEN** 用户改变出口半径使其小于、等于或大于入口半径
- **THEN** 页面显示与连续性方程及水平伯努利方程一致的速度与压力差，并说明模型条件

#### Scenario: 流量练习
- **WHEN** 用户改变入口半径或流速以达到目标流量
- **THEN** 目标按毫米到米转换后的 L/s 数值判定
