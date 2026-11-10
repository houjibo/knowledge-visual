# factor-multiple-challenge Specification

## Purpose
本规格规范闯关题目生成可靠；每题只记录一次；完成十题记录进度，核心边界为：系统必须使用有限候选生成正确答案和互不重复的选项，并明确最小正倍数。

## Requirements

### Requirement: 闯关题目生成可靠
系统 SHALL 使用有限候选生成正确答案和互不重复的选项，并明确最小正倍数。

#### Scenario: 固定随机数生成各类题目
- **WHEN** 随机数固定且生成每种题型
- **THEN** 题目生成结束，选项不重复且包含正确答案

### Requirement: 每题只记录一次
系统 SHALL 在回答或超时后禁用选项并只记录一次结果。

#### Scenario: 提交后再次触发答题或超时
- **WHEN** 学生回答后再次触发答题或超时
- **THEN** 按钮不可用且只保留一条记录

### Requirement: 完成十题记录进度
系统 SHALL 在十题中答对至少六题后记录主题完成。

#### Scenario: 完成十道正确题目
- **WHEN** 学生连续答对十题并刷新
- **THEN** 结果显示十题全对且完成记录仍然存在
