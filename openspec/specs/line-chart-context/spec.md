# line-chart-context Specification

## Purpose
TBD - created by archiving change line-chart-context-and-units. Update Purpose after archive.

## Requirements

### Requirement: 图表问题的单位与上下文清晰
折线图的数值及差值题 SHALL 使用与纵轴一致的单位，挑战模式 SHALL 在图表旁显示当前数据主题。

#### Scenario: 按千步读数
- **WHEN** 学习者看到每日步数统计的数值或差值题
- **THEN** 问题中的单位为千步，与纵轴一致

#### Scenario: 挑战模式换题
- **WHEN** 挑战生成新图表
- **THEN** 标题随图表更新并描述当前数据主题
