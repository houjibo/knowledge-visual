# learning-progress-backup Specification

## Purpose
TBD - created by archiving change learning-progress-backup. Update Purpose after archive.

## Requirements

### Requirement: 本地备份主题完成记录
首页 SHALL 允许用户将学科主题完成记录导出为本地版本化文件，并说明不包含其他学习历史。

#### Scenario: 导出进度
- **WHEN** 学习者选择导出
- **THEN** 文件仅包含允许的完成记录键，保留原始记录且不上传

### Requirement: 预览后安全合并记录
首页 SHALL 在导入前校验和预览，合并时保留本机已有同名记录，并在写入失败时尽力回滚、如实报告结果。

#### Scenario: 备份与本机记录冲突
- **WHEN** 备份中存在本机已有的同名记录
- **THEN** 合并保留本机值，包括 false 清除标记，并仅添加本机没有的记录

#### Scenario: 损坏数据或写入失败
- **WHEN** 导入文件或目标记录损坏，或写入发生错误
- **THEN** 页面阻止导入或尽力恢复已写入的数据，无法恢复时明确提示
