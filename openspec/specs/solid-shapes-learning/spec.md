# solid-shapes-learning Specification

## Purpose
TBD - created by archiving change solid-shapes-learning. Update Purpose after archive.

## Requirements

### Requirement: 立体图形练习具有唯一正确选项
系统 SHALL 对每道题生成四个互异选项，并且恰有一个选项计为正确。

#### Scenario: 各图形和题型
- **WHEN** 学习者回答形状识别、属性、生活示例、比较或表面题
- **THEN** 题目只有一个正确答案，反馈与几何属性一致

### Requirement: 表面与直棱口径清晰
系统 SHALL 区分圆柱的两个圆形平面、一个曲面和圆形边界，不将曲线边界当作直棱。

#### Scenario: 查看圆柱
- **WHEN** 学习者选择圆柱详情
- **THEN** 页面展示两个圆形平面、一个曲面及圆形边界的说明

### Requirement: 分类可用且每题只计一次
系统 SHALL 有限生成分类题，提供键盘按钮，并在首次作答后锁定本题。

#### Scenario: 随机值持续重复
- **WHEN** 随机数持续重复，学习者连续分类
- **THEN** 题目可继续生成且同一道题重复操作不会重复计分
