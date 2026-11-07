# physics-chemistry-progress-storage Specification

## Purpose
TBD - created by archiving change physics-chemistry-progress-resilience. Update Purpose after archive.

## Requirements

### Requirement: 物理化学进度异常可恢复
物理与化学各学段进度 SHALL 保留格式异常的原始数据，使页面继续运行，并在本页内存中保留无法保存的修改。

#### Scenario: 进度格式损坏
- **WHEN** 进度数据不是合法的 JSON 对象
- **THEN** 不覆盖原文，不抛出未处理异常，当前页面可继续使用

### Requirement: 顺序记录完成不丢失
物理与化学各学段 SHALL 在写入前读取最新进度，保留其他标签页已写入的记录。

#### Scenario: 不同标签页先后完成
- **WHEN** 同学段两个已打开主题依次记录完成
- **THEN** 两条记录均保留

### Requirement: 测验保存失败提示
已修复的 17 个物理化学同源测验及化学平衡练习 SHALL 在完成记录保存失败时显示本次进度未保存。

#### Scenario: 测验通关时写入失败
- **WHEN** 完成条件已满足但浏览器拒绝写入
- **THEN** 页面说明本次已完成但进度未保存
