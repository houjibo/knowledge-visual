## ADDED Requirements

### Requirement: 归档能力规格用途可发现

仓库中每份主能力规格 SHALL 包含至少 50 个字符的中文 `## Purpose`，准确概括该规格需求的适用能力或边界；用途不得保留 CLI 生成的 `TBD - created by archiving` 占位。静态检查 SHALL 对任一缺失、过短或仍含占位文本的用途报告文件路径并以非零状态退出。

#### Scenario: 贡献者查找能力规格

- **WHEN** 贡献者在细读需求场景前打开一份主规格
- **THEN** `Purpose` 能说明该规格覆盖的能力范围和关键边界

#### Scenario: 归档后保留生成占位

- **WHEN** 主规格 Purpose 缺失、少于 50 个字符或仍包含归档占位文本
- **THEN** 静态检查报告对应规格路径并以非零状态退出
