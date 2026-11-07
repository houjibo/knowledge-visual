# science-quiz-progress Specification

## Purpose
TBD - created by archiving change science-quiz-progress-integrity. Update Purpose after archive.

## Requirements

### Requirement: 测验按不同题目计算分数
沉与浮测验 SHALL 保留本轮每题的首次答案，按不同题目的正确数评分，至少正确四题才记录完成。

#### Scenario: 反复返回同一题
- **WHEN** 学习者正确回答一题后多次往返并重复激活该题选项
- **THEN** 该题只计一分，原答案和解释保持可见

#### Scenario: 完成后恢复
- **WHEN** 学习者在一轮中正确回答至少四道不同的题
- **THEN** 显示通关并记录完成，刷新主题及返回目录后显示完成状态

#### Scenario: 键盘答题
- **WHEN** 学习者聚焦选项并使用空格或回车
- **THEN** 选项被激活并显示反馈，焦点可见
