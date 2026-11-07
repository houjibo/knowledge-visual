# math-stage-directory-progress Specification

## Purpose
TBD - created by archiving change math-stage-directory-progress. Update Purpose after archive.

## Requirements

### Requirement: 数学学段目录区分进度不可读
初中、高中和大学数学目录 SHALL 在进度存储不可读或损坏时显示提示并保留原始记录。

#### Scenario: 进度损坏
- **WHEN** 旧版或学段版数据不可解析
- **THEN** 目录仍可浏览，提示进度不可用并移除可能过期的徽章

### Requirement: 学段目录徽章随记录变化刷新
目录 SHALL 在返回页面或相关跨标签存储变化时重新计算完成徽章。

#### Scenario: 完成或清除主题
- **WHEN** 同学段另一标签页保存或清除完成记录
- **THEN** 该目录徽章同步显示或移除，不与其他学段同名主题混淆
