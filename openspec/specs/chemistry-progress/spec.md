# chemistry-progress Specification

## Purpose
使学习者在化学学科入口看到与对应学段主题导航一致的完成总数，从而理解已完成学习的比例和剩余学习范围。

## Requirements

### Requirement: 化学学段进度总数
化学学科入口 SHALL 使用对应学段导航中的主题数量作为学段进度分母，并保留已有本地进度数据。

#### Scenario: 已完成部分高中主题
- **WHEN** 本地存储记录 2 个高中化学主题已完成
- **THEN** 高中卡片显示 2/16 和四舍五入后的 13%

#### Scenario: 尚无大学进度
- **WHEN** 本地存储未记录大学化学主题完成情况
- **THEN** 大学卡片显示尚未开始
