# equilibrium-quiz Specification

## Purpose
TBD - created by archiving change equilibrium-quiz-integrity. Update Purpose after archive.

## Requirements

### Requirement: 平衡练习按题记录正确状态
化学平衡综合练习 SHALL 允许错题重试、每题正确只计一分，在所有不同题目均答对时记录完成，并提供键盘操作。

#### Scenario: 返回已答对的题目
- **WHEN** 学习者返回并再次激活已答对题目
- **THEN** 成绩不增加，原选择和反馈保留

#### Scenario: 答错后重试并完成
- **WHEN** 学习者更正错题并最终答对所有题
- **THEN** 每题计一分，完成状态持久化并可在刷新后恢复
