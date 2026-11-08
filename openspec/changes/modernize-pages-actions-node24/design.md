## Context

见 proposal.md - Why。当前工作流已使用 `actions/checkout@v6` 和 `actions/setup-node@v6`，两者均声明 `node24`；Pages 配置、Pages 部署以及失败诊断 artifact 仍有旧主版本。`upload-pages-artifact@v5` 是复合 action，官方 action 定义将上传委托给固定的 `actions/upload-artifact@v7.0.0`。

## Goals / Non-Goals

**Goals:**

- 让工作流直接调用和 Pages 复合依赖调用的 JavaScript Action 均使用 Node.js 24。
- 只改变 Action 版本，保留权限、触发条件、检查顺序、artifact 名称、保留期限和部署验收。

**Non-Goals:**

- 不升级应用测试所用 Node.js 22，也不修改 Node.js 本地最低版本要求。
- 不变更 npm 依赖、runner、Action 固定 SHA 策略或站点内容。

## Decisions

1. **按官方兼容主版本升级 Pages Action。** 使用 `actions/configure-pages@v6`、`actions/upload-pages-artifact@v5` 和 `actions/deploy-pages@v5`。官方发布说明明确 configure-pages v6 与 deploy-pages v5 使用 Node.js 24；Pages artifact v5 内部固定调用 upload-artifact v7.0.0。保留工作流既有的主版本标签约定。参考：[configure-pages 发布记录](https://github.com/actions/configure-pages/releases/tag/v6.0.0)、[deploy-pages 发布记录](https://github.com/actions/deploy-pages/releases/tag/v5.0.0)、[upload-pages-artifact action 定义](https://github.com/actions/upload-pages-artifact/blob/v5/action.yml)。
2. **将诊断 artifact action 升到 v7。** `upload-artifact@v7` 的 action 定义声明 Node.js 24；这覆盖工作流中失败时上传浏览器诊断的两处调用。参考：[upload-artifact v7 action 定义](https://github.com/actions/upload-artifact/blob/v7/action.yml)。
3. **保留现有 checkout/setup-node。** 它们已经使用 Node.js 24 action runtime；`setup-node` 输入的 Node.js 22 是项目测试环境，不是 action runtime，因此不改动。
4. **用完整远端工作流验证兼容性。** 静态检查不能执行 GitHub runner 上的 action；推送后的 checks、构建、部署和部署后验收是最终集成证据，并检查日志中不再有 Node.js 20 弃用警告。

## Risks / Trade-offs

- [新主版本可能改变输入或 artifact 兼容行为] → 保持现有输入和流程不变，在推送后的 Actions 中核对诊断上传、Pages artifact、部署以及公网验收作业；任一失败即回退相关 Action 主版本并保留失败证据。
- [主版本标签随上游更新而变化] → 延续仓库既有主版本策略；后续升级仍需检查官方发布说明并让 CI 端到端验证。

## Migration Plan

只修改 workflow 中四类 Action 版本。先运行本地静态与 OpenSpec 检查，再提交并推送到 `main`；确认完整 GitHub Actions 运行通过、诊断 artifact 配置未报错且弃用警告消失。若新版本不兼容，回退对应 Action 行至原主版本并重新运行检查。
