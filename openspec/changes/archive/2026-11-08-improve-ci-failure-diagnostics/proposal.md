## Why

远端浏览器检查失败时公开检查注释仅显示退出码，详细日志和诊断包需要仓库认证，难以迅速定位问题。

## What Changes

- GitHub Actions 中同时使用 Playwright 列表和 GitHub 注释报告器，保留本地列表输出和失败诊断包。
- 记录已知远端检查结果及发布状态，不把注释当作完整日志。

## Capabilities

### New Capabilities

- `ci-failure-diagnostics`: 浏览器测试失败时提供可定位的检查注释。

### Modified Capabilities

无。

## Impact

影响 Playwright 报告配置和站点运营文档，不改变学习站内容或发布权限。
