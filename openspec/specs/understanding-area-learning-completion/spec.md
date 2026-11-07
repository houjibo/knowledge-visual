# understanding-area-learning-completion Specification

## Purpose
TBD - created by archiving change understanding-area-learning-completion. Update Purpose after archive.

## Requirements

### Requirement: 认识面积的学习完成可见并保存
页面 SHALL 跟踪面积比较、铺格和判断三类活动，全部达标后保存完成记录。

#### Scenario: 部分完成
- **WHEN** 学习者只完成部分条件
- **THEN** 页面显示剩余条件并说明刷新会清空阶段进度

#### Scenario: 全部完成及保存失败
- **WHEN** 三项条件达标
- **THEN** 完成记录在刷新与知识地图中保留；保存失败时允许重试

### Requirement: 学习者可以阅读作答反馈
页面 SHALL 在答题后保留当前题目和解析，直到学习者主动换题。

#### Scenario: 正确回答判断题
- **WHEN** 学习者回答正确
- **THEN** 解释持续可见、不能重复计分，并可主动进入下一题
