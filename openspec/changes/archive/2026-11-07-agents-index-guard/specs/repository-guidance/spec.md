## ADDED Requirements

### Requirement: 根索引可自动校验
项目静态检查 SHALL 验证根 AGENTS.md 只包含标题和指向仓库内现存 Markdown 文件的独立索引项，且包含必要的设计、约束、差距、三个工作流和 OpenSpec 入口。

#### Scenario: 详细规则写入根索引
- **WHEN** AGENTS.md 中出现非标题且非独立链接的规则文本
- **THEN** 静态检查失败并定位行号

#### Scenario: 必要工作流入口缺失
- **WHEN** 根索引删除任一必要工作流链接
- **THEN** 静态检查报告缺失入口
