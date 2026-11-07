# numbers-shapes-learning Specification

## Purpose
TBD - created by archiving change numbers-shapes-learning. Update Purpose after archive.

## Requirements

### Requirement: 有限取半的精确与近似表达
系统 SHALL 将有限次取半的结果表示为精确分数，并用近似符号标示舍入后的十进制数。

#### Scenario: 取八次
- **WHEN** 学习者选择取半模式并设置八轮
- **THEN** 页面显示已取 255/256、近似 0.9961 及剩余 1/256

### Requirement: 有限生成并解释挑战题
系统 SHALL 生成四个互异选项并提供答案解释，不得依赖无界随机重试。

#### Scenario: 固定重复随机值
- **WHEN** 随机数持续重复
- **THEN** 练习与挑战仍可生成可回答的题目

#### Scenario: 答错挑战
- **WHEN** 学习者选择错误答案
- **THEN** 显示正确选项与解释，且本题只计一次
