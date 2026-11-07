# data-analysis-comparison Specification

## Purpose
TBD - created by archiving change data-analysis-comparison-accuracy. Update Purpose after archive.

## Requirements

### Requirement: 对比结论反映当前数据
对比图 SHALL 根据两组当前方差生成波动比较；两组平均数不同时 SHALL 提醒考虑平均水平。

#### Scenario: 修改后方差关系反转
- **WHEN** 学习者将 A 组第五个数改为 20 并进入对比
- **THEN** 图文报告 B 组方差较小，并显示当前统计值

### Requirement: 控件状态与可操作行为一致
对比模式 SHALL 禁用不能改变数据的滑块；单组模式 SHALL 恢复该组的第五个值。

#### Scenario: 切换数据集
- **WHEN** 学习者在对比后回到 A 或 B
- **THEN** 滑块可操作且展示该组最近的数值
