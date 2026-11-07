# cylinder-cone-challenge-reliability Specification

## Purpose
TBD - created by archiving change cylinder-cone-challenge-reliability. Update Purpose after archive.

## Requirements

### Requirement: 圆柱圆锥闯关保留结果并可重玩
页面 SHALL 对每题只接受一次回答，显示反馈并允许学习者主动继续。

#### Scenario: 回答错误
- **WHEN** 学习者选择错误答案
- **THEN** 页面显示正确答案并提供重新开始，重复操作不改变计数

#### Scenario: 答对十题
- **WHEN** 学习者连续答对十题
- **THEN** 页面保留完成反馈并提供重玩

### Requirement: 完成记录可恢复
页面 SHALL 在连续答对五题后保存主题完成记录，并在保存失败时允许重试。

#### Scenario: 存储恢复
- **WHEN** 达标时保存失败，随后存储恢复
- **THEN** 页面显示未保存状态，重试后知识地图显示完成
