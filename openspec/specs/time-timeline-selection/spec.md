# time-timeline-selection Specification

## Purpose
TBD - created by archiving change time-timeline-selection. Update Purpose after archive.

## Requirements

### Requirement: 时间线的选择与题目同步
时间线 SHALL 支持键盘选择事件，题目 SHALL 使用所选事件及时间。

#### Scenario: 选择事件
- **WHEN** 学习者以键盘选择午餐事件
- **THEN** 事件显示选中状态，题目询问午餐对应的时间转换

### Requirement: 时间线反馈不被旧操作覆盖
答题反馈 SHALL 保留至学习者选择其他事件或主动换题。

#### Scenario: 答题后选择新事件
- **WHEN** 学习者答题后选择另一事件
- **THEN** 页面显示新事件的问题，先前答题不会通过延时操作覆盖它
