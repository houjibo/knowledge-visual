# percentage-challenge Specification

## Purpose
TBD - created by archiving change percentage-challenge-correctness. Update Purpose after archive.

## Requirements

### Requirement: 百分数挑战题目与反馈正确
百分数挑战 SHALL 正确处理小数百分数，确保增加题的数据确实增加，作答前不显示答案，作答后提供解释并阻止重复计分。

#### Scenario: 八分之一转百分数
- **WHEN** 题目为 1/8 化成百分数
- **THEN** 正确选项为 12.5%，作答前不显示答案或解释

#### Scenario: 增长率题
- **WHEN** 题目询问增加百分率
- **THEN** 终值大于初值且题目说明取整规则

#### Scenario: 作答反馈
- **WHEN** 学习者选择答案
- **THEN** 显示结果与解释，锁定选项并允许主动开始下一题
