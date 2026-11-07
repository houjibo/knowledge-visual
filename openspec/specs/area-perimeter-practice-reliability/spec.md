# area-perimeter-practice-reliability Specification

## Purpose
TBD - created by archiving change area-perimeter-practice-reliability. Update Purpose after archive.

## Requirements

### Requirement: 练习与挑战逐题可靠计分
页面 SHALL 对每题的首次有效完成计分，并分别维护普通练习和挑战的连对数。

#### Scenario: 重复回车
- **WHEN** 完成一道题后再次按回车
- **THEN** 得分不再变化，反馈持续显示直到学习者换题

#### Scenario: 挑战完成
- **WHEN** 学习者在挑战中连续答对五题
- **THEN** 保存主题完成记录，普通练习的连对不计入此条件

### Requirement: 面积比较题可处理相等
页面 SHALL 在两图面积相等时允许填写共同面积，并有限生成题目。

#### Scenario: 两图面积相等
- **WHEN** 比较题生成相同的面积
- **THEN** 显示相等时的答题规则并正确判分
