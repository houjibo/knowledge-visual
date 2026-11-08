## 1. 升级工作流 Action

- [x] 1.1 在 `.github/workflows/checks.yml` 将 Pages 配置、Pages artifact、Pages 部署和两处诊断 artifact 上传分别升级到 Node.js 24 兼容主版本；确认 `git diff` 仅改 Action 版本且保留现有参数。
- [x] 1.2 运行 `npm run check:static` 和 `git diff --check`，确认静态检查、OpenSpec 严格校验和补丁格式通过（202 项通过）；Ruby YAML 解析通过。

## 2. 远端发布验收

- [ ] 2.1 推送后确认 GitHub Actions 的检查、发布构建、Pages 部署及部署后验收全部成功，并核对日志无 Node.js 20 弃用警告。
- [ ] 2.2 核对发布清单 revision 与推送提交一致，并确认本地和公网学习页面可访问后归档该变更。
