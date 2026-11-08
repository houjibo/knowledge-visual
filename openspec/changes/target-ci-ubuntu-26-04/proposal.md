## Why

GitHub Actions 的 `ubuntu-latest` 正在分阶段迁移到 Ubuntu 26.04；该标签会在迁移窗口中指向不同的大版本，使同一工作流的运行环境随时间改变。Ubuntu 26.04 已正式可用于生产，现在应明确选择并完整验证迁移目标。

## What Changes

- 将检查、构建、部署和部署后验收的 runner 标签统一固定为 `ubuntu-26.04`。
- 保持测试命令、Node.js 测试版本、发布步骤及产品行为不变。
- 用 GitHub Actions 全量检查和发布后验收验证新 runner。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

无。此变更只固定 CI 执行环境，不改变产品或学习者可见行为；`.openspec.yaml` 设置 `skip_specs: true`。

## Impact

- 修改 `.github/workflows/checks.yml` 中四个 job 的 `runs-on`。
- GitHub-hosted Actions 的系统镜像由移动标签切换为明确的 Ubuntu 26.04 LTS 标签；不修改站点文件或依赖。
