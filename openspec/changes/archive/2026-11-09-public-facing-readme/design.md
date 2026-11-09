## Context

当前公开站点为 GitHub Pages 静态站，位于 `https://houjibo.github.io/knowledge-visual/`；本地预览无需构建工具。README 的详情以学习者和首次访问仓库的人为读者。

## Goals / Non-Goals

**Goals:**

- 让读者从 README 直接找到在线站点并理解基本学习路径。
- 保留简洁的本地预览命令和反馈入口。

**Non-Goals:**

- 不在 README 复述 OpenSpec、内部工作流、迁移记录或运营计划。
- 不承诺尚未验证的功能、主题数量或服务可用性目标。

## Decisions

- 以“项目介绍、在线站点、如何使用、内容范围、本地预览、反馈”组织内容；详细工程维护说明继续由仓库内相应文档维护，不作为公开入口的主体。
- 在线站点使用稳定的 GitHub Pages 根地址；本地说明仅使用仓库相对路径和标准静态服务器命令。

## Risks / Trade-offs

- 页面入口或托管地址将来变化时 README 链接可能过期 → 保持链接数量精简，并纳入现有静态站点链接检查。

## Migration Plan

直接替换 README 文案；回退时恢复上一版 README，无需数据或站点迁移。

## Open Questions

无。
