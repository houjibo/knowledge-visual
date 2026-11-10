## Context

课程设计文档记录首批主题时使用了变更的活动态目录；归档后 OpenSpec 将提案移入带日期的 `openspec/changes/archive/` 子目录。此变更只需更新 Markdown 相对链接。

## Goals / Non-Goals

**Goals:**

- 让课程设计可打开首批计算机与人工智能主题的归档提案。

**Non-Goals:**

- 不变更课程内容、页面行为、规格或 OpenSpec 归档策略。

## Decisions

- 链接到归档目录中的 `proposal.md`，保留原变更名称并明确其历史状态；不链接到实现页面或当前能力规格，因为该段说明的是首批交付变更的来源。

## Risks / Trade-offs

- 归档路径包含日期，若将来再次迁移归档目录，链接仍需同步更新；静态链接检查与直接检查目标文件可发现断链。
