## Why

最近的 GitHub Actions 部署运行仍报告 Node.js 20 弃用警告，来自 Pages 配置、部署和 artifact 上传链。升级到官方支持 Node.js 24 的当前主版本，减少运行时弃用风险并保持现有发布流程。

## What Changes

- 将 `configure-pages`、`upload-pages-artifact`、`deploy-pages` 和诊断用 `upload-artifact` 更新到兼容 Node.js 24 的版本。
- 保持检查、构建、版本溯源、Pages 部署和部署后验收行为不变。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

无。此变更只升级 CI 工具链，不改变产品行为或站点发布契约；`.openspec.yaml` 设置 `skip_specs: true`。

## Impact

- 修改 `.github/workflows/checks.yml` 的 Action 版本。
- GitHub-hosted Actions 的运行时和 Pages artifact 上传依赖随之更新；不修改页面、站点依赖或发布产物格式。
