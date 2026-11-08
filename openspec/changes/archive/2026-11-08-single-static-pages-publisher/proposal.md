## Why
仓库已有主分支质量门禁、静态发布包来源约束、版本溯源和部署后验证。新增的通用 Jekyll 工作流绕过这些检查，直接从仓库目录发布且不含版本清单；两个 Pages 发布者可能竞争并覆盖彼此的产物。

## What Changes
- 移除通用 Jekyll Pages 发布工作流，保留项目的受控 Static HTML 发布链作为唯一发布者。
- 静态检查验证仓库只有一个 Pages 部署工作流，且该工作流包含发布包构建和部署后版本核验。
- 将站点运维规范中的过时运行策略改为验证主分支当前提交并阻止旧版本部署，与工作流配置一致。

## Capabilities
### New Capabilities

### Modified Capabilities
- `site-operations`: 限制 Pages 仅由唯一的、经过质量门禁的静态发布链部署。

## Impact
GitHub Actions Pages 工作流、静态检查、发布运维规范及部署验证。
