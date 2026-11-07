## Why
现有流水线在部署动作返回成功后即结束，无法自动证明公网实际提供了预期版本、资源和可操作的学习路径。独立站点需要可复现的部署后检查及失败证据。

## What Changes
增加公网版本与代表资源核验，部署后使用桌面和窄屏浏览器检查首页及四学科学习路径；部署尚未启用时不宣称公网已经验证。

## Capabilities
### New Capabilities
- `published-release-verification`: 公网提交、资源和代表性学习路径的部署后验证。

### Modified Capabilities

## Impact
GitHub Actions、发布测试、验证脚本与站点运营文档；不会更改学习进度或公开用户数据。
