## Why
连续小步推送导致同分支正在运行的 GitHub Actions 检查反复被取消，近期多次提交均未获得完整远端检查结果，影响发布证据。

## What Changes
- 保留正在运行的检查，等待队列仅保留最新运行。
- 检查完成后核对主分支，过时版本跳过构建和部署；获取远端失败时阻止发布。
- 保留部署前再次核对和发布后验证。

## Capabilities
### New Capabilities
- `ci-rapid-push-check-continuity`: 快速推送时检查连续性和过时版本发布保护。

### Modified Capabilities

## Impact
GitHub Actions 工作流、版本核验脚本与测试、站点运营记录；GitHub Pages 启用和公网部署仍需另行完成。
