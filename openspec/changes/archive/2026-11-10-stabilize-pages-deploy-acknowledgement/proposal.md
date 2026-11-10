## Why

Actions #208 的检查与构建通过，但 Pages deployment 在 10 分钟后结束为 `error`，工作流被取消，部署后核验未运行；与此同时，公网清单已匹配提交 `34f9a56`，直接版本与资源核验通过。当前流水线无法可靠地区分缓慢的部署确认与未发布状态，需要提供更合适的有界等待，并保持部署后核验为发布成功的必要条件。

## What Changes

- 将 Pages 部署 job 的有界运行窗口从 10 分钟提高到 20 分钟，不允许超时被解释为成功。
- 静态守卫检查唯一发布者具有足够的部署等待窗口，并且部署后版本、资源和浏览器核验仍是发布门禁。
- 更新站点运营计划和差距台账，记录本次部署状态证据及后续验收标准。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `published-release-verification`: 部署确认需在有界窗口内完成；只有部署终态成功且部署后验证通过才能报告自动发布完成。

## Impact

- `.github/workflows/checks.yml` 的 Pages 部署超时配置。
- `scripts/check_pages_publisher.py` 和 `tests/pages_publisher_test.py` 的发布流程守卫。
- `openspec/specs/published-release-verification/`（含用途定义）、`docs/plans/site-operations.md` 与 `docs/gaps.md`。
