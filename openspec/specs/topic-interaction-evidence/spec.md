# topic-interaction-evidence Specification

## Purpose
TBD - created by archiving change topic-interaction-evidence-index. Update Purpose after archive.

## Requirements

### Requirement: 逐主题交互证据可追踪
仓库 SHALL 提供逐主题的部分交互证据索引，明确测试范围并列出尚未登记的主题，不能把加载冒烟或测试存在描述为完整验收。

#### Scenario: 查看主题证据
- **WHEN** 维护者查看已登记主题
- **THEN** 索引列出测试文件与覆盖边界，明确这不证明本次测试通过或主题已验收

#### Scenario: 引用或清单发生漂移
- **WHEN** 证据指向不存在主题、缺失测试、未纳入测试入口的文件，或生成索引未更新
- **THEN** 静态检查失败并提示问题
