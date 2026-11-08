## Why

最新发布的版本、资源及本地发布包交互检查均通过，但公网浏览器路径在不同页面遇到间歇性操作超时。公网浏览器验收需要一次受控重试来容忍短暂网络波动，同时保留失败重现和诊断能力。

## What Changes

- 为公网浏览器访问设置 `Cache-Control: no-cache`，降低 Pages 边缘缓存短时不一致的影响。
- 仅为部署后的公网学习路径 Playwright 用例启用一次自动重试，每次重试使用新的测试上下文。
- 保持预发布本地静态产物的浏览器回归不重试，避免降低核心功能质量门槛。
- 继续要求公网版本、资源和学习交互全部验证通过。

## Capabilities

### New Capabilities

无。此变更只调整发布验证遇到瞬时失败时的重试策略，不改变学习者可见行为。

### Modified Capabilities

无。

## Impact

- 修改 `.github/workflows/checks.yml` 中部署后的浏览器验证命令。
- 不修改站点内容、运行时依赖或发布产物。
- `.openspec.yaml` 使用 `skip_specs: true`，因为没有产品行为契约变化。
