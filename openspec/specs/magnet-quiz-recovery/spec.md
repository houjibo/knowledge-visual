# magnet-quiz-recovery Specification

## Purpose
TBD - created by archiving change magnet-quiz-recovery. Update Purpose after archive.

## Requirements

### Requirement: 测验可恢复并如实反馈
磁铁主题 SHALL 说明首次答对的完成条件，允许重新开始一轮，并根据实际作答报告结果。

#### Scenario: 跳题后结束
- **WHEN** 学习者跳过题目并点击完成
- **THEN** 页面报告已答题数并提示返回未作答题目

#### Scenario: 首次答错后重测
- **WHEN** 学习者首次答错并重新开始一轮
- **THEN** 本轮作答状态清空，重新答对全部题目且访问所有板块后可获得完成记录

### Requirement: 保存失败可见且可重试
页面 SHALL 区分本轮达标和持久保存成功，并提供保存重试。

#### Scenario: 存储暂时不可写
- **WHEN** 学习者达到完成条件但保存失败
- **THEN** 页面提示进度未保存，存储恢复后可重试并保存完成记录
