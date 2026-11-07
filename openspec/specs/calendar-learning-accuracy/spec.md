# calendar-learning-accuracy Specification

## Purpose
TBD - created by archiving change calendar-learning-accuracy. Update Purpose after archive.

## Requirements

### Requirement: 月份和闰年按明确规则表达
日历 SHALL 正确显示北半球气象季节；闰年计算 SHALL 使用格里高利历规则且只接受有效整数年份。

#### Scenario: 季节边界
- **WHEN** 学习者查看三月或十二月
- **THEN** 页面分别显示北半球气象春季或冬季

#### Scenario: 世纪闰年
- **WHEN** 学习者检查 1900 和 2000 年
- **THEN** 页面分别报告平年和闰年

### Requirement: 日期题与作答统计无歧义
日期题 SHALL 区分日期间隔与首尾均计的日期数，单道题 SHALL 最多计分一次。

#### Scenario: 键盘重复提交
- **WHEN** 学习者已回答一道换算或选择题并再次提交
- **THEN** 已做及正确数不再增加
