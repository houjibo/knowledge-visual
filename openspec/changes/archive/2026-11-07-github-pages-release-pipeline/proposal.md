## Why
站点已有受控发布包与子路径验证，但缺少检查通过后部署到公开站点的自动流程；近期远端测试存在失败，不能将推送直接当作成功发布。

## What Changes
将 Pages 构建和部署接入主分支完整检查之后，限制部署权限及触发条件，记录启用前提、验证与回退步骤。

## Capabilities
### New Capabilities

### Modified Capabilities
- `site-operations`: 为独立站点增加受控 GitHub Pages 发布流程。

## Impact
GitHub Actions、运营计划及差距台账；启用 Pages 和实际公网部署仍需仓库配置与验证。
