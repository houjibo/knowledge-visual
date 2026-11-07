# science-chemistry-model Specification

## Purpose
TBD - created by archiving change science-chemistry-model. Update Purpose after archive.

## Requirements

### Requirement: 化学示意反馈与模型范围一致
系统 SHALL 正确显示石蕊酸碱颜色，区分反应生成气体和已有气体释放，并说明动画不计算实际数量或速率。

#### Scenario: 石蕊颜色过渡
- **WHEN** 学习者选择白醋
- **THEN** 指示剂连续趋向红色，反馈标明酸性而非提供固定样品 pH

#### Scenario: 气泡动画
- **WHEN** 学习者选择小苏打或薄荷糖
- **THEN** 页面分别说明反应产生二氧化碳或原有二氧化碳释放，单轮动画有限结束

### Requirement: 不同题目计分并如实保存
系统 SHALL 按答对的不同题目统计完成条件，存储失败时提供重试。

#### Scenario: 重复答对同一题
- **WHEN** 学习者在不同轮次重复答对同一题
- **THEN** 完成进度只将该题计入一次

#### Scenario: 进度保存失败
- **WHEN** 学习者达到完成条件但存储不可用
- **THEN** 页面提示未保存并允许重试，成功后刷新可恢复
