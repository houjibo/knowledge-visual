# telling-time-learning-reliability Specification

## Purpose
TBD - created by archiving change telling-time-learning-reliability. Update Purpose after archive.

## Requirements

### Requirement: 钟表练习有限生成且不会重复计分
页面 SHALL 在随机值持续重复时加载并生成四个不同选项，单道题 SHALL 最多计一次连对。

#### Scenario: 重复提交
- **WHEN** 学习者回答一道读钟、拨钟或选择题
- **THEN** 本题锁定，学习者可主动换题，重复提交不增加连对

### Requirement: 学习完成条件可见且可保存
页面 SHALL 跟踪调整钟面和三种练习各答对一次，全部达标后保存小学主题完成记录。

#### Scenario: 存储暂时不可用
- **WHEN** 最佳成绩或学习进度无法保存
- **THEN** 页面提示受影响的记录，学习仍可继续，进度恢复后可重试保存
