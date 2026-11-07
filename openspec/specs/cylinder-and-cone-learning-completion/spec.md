# cylinder-and-cone-learning-completion Specification

## Purpose
TBD - created by archiving change cylinder-and-cone-learning-completion. Update Purpose after archive.

## Requirements

### Requirement: 圆柱与圆锥练习保留反馈
页面 SHALL 每题只接受一次答案，并保留反馈直至学习者主动进入下一题。

#### Scenario: 重复作答
- **WHEN** 学习者已回答计算题或挑战题并重复操作
- **THEN** 得分不变，当前题目和反馈仍可阅读

### Requirement: 跨活动完成记录可恢复
页面 SHALL 跟踪两种展开图、三道正确计算题及十题挑战至少七题正确，并在全部达标后保存完成记录。

#### Scenario: 部分及全部达标
- **WHEN** 学习者完成部分或全部条件
- **THEN** 页面显示剩余条件或保存完成，刷新后仅保留已保存的完成记录

#### Scenario: 保存失败后恢复
- **WHEN** 达标时存储失败，之后存储恢复
- **THEN** 页面提示未保存并允许重试，成功后知识目录显示完成
