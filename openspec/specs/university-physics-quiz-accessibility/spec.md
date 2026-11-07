# university-physics-quiz-accessibility Specification

## Purpose
TBD - created by archiving change university-physics-quiz-accessibility. Update Purpose after archive.

## Requirements

### Requirement: 测验选项可用键盘操作
五个大学物理主题的测验 SHALL 使用可聚焦选项并反馈选择状态，提交后按题目正确数评分。

#### Scenario: 选择并修改答案
- **WHEN** 学习者使用键盘选择并更改选项
- **THEN** 页面显示当前选择和反馈，最终成绩按最后选择计分

### Requirement: 进度保存反馈真实
测验通过时 SHALL 根据存储结果提示保存状态并允许失败后重试。

#### Scenario: 存储暂时不可用
- **WHEN** 测验通过但写入失败
- **THEN** 页面提示进度未保存；存储恢复后重试可保存并在刷新后恢复
