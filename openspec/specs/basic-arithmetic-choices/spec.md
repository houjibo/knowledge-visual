# basic-arithmetic-choices Specification

## Purpose
确保小学除法与数的组成主题在生成小数字练习时不会卡住，并为学习者提供不同的选项、正确答案和可观察的答题反馈。

## Requirements

### Requirement: 小数字选项有界生成
除法和数的组成页面 SHALL 在有限步骤内生成四个互不相同的正整数选项，且其中包含题目的正确答案。

#### Scenario: 两个物品平均分
- **WHEN** 题目将 2 个物品平均分给 2 人
- **THEN** 页面显示四个不同选项并将 1 判为正确

#### Scenario: 凑成 3
- **WHEN** 题目为 1 加多少等于 3
- **THEN** 页面显示四个不同选项并将 2 判为正确
