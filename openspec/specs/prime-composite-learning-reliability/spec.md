# prime-composite-learning-reliability Specification

## Purpose
确保质数与合数的判断、筛选和因数练习能够可靠出题、支持键盘及自主阅读反馈，并在学习者完成三类活动后保存可恢复的主题进度。

## Requirements

### Requirement: 练习可访问且可靠出题
因数练习 SHALL 从有限候选生成不重复选项且包含所有正确因数，筛选和因数选项 SHALL 支持键盘，答题后 SHALL 保留反馈并允许主动换题。

#### Scenario: 重复随机值
- **WHEN** 随机值持续相同
- **THEN** 页面正常加载，因数选项无重复且包含全部正确因数

#### Scenario: 答错继续
- **WHEN** 学习者提交错误答案
- **THEN** 页面显示反馈并可主动进入下一题

### Requirement: 三类活动完成后保存
页面 SHALL 在判断、筛选质数和找因数各答对一题后保存主题完成记录，并在保存失败时提供重试。

#### Scenario: 存储失败恢复
- **WHEN** 三项均达标但存储写入失败
- **THEN** 页面提示未保存，恢复存储后可重试并持久化完成记录
