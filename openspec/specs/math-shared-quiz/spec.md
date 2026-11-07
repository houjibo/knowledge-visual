# math-shared-quiz Specification

## Purpose
TBD - created by archiving change math-shared-quiz-integrity. Update Purpose after archive.

## Requirements

### Requirement: 测验逐题计分且支持回看
使用共享组件的页面 SHALL 按每道题的首次答案计分，回看保留反馈，未作答题计零分，重测清空本轮答案。

#### Scenario: 多次回看已答题
- **WHEN** 学习者多次回看一题并完成测验
- **THEN** 该题最多计分一次，不因回看虚增成绩

### Requirement: 可用键盘答题并如实报告进度
使用共享组件的页面 SHALL 提供键盘可操作的模式和答案按钮；通关进度写入失败时 SHALL 显示未保存。

#### Scenario: 文件协议下通关且保存失败
- **WHEN** 学习者直接打开页面、达到通关门槛而存储不可用
- **THEN** 测验可完成且页面提示进度未保存
