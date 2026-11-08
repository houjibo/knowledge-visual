## 1. 升级工作流 Action

- [x] 1.1 在 `.github/workflows/checks.yml` 将 Pages 配置、Pages artifact、Pages 部署和两处诊断 artifact 上传分别升级到 Node.js 24 兼容主版本；确认 `git diff` 仅改 Action 版本且保留现有参数。
- [x] 1.2 运行 `npm run check:static` 和 `git diff --check`，确认静态检查、OpenSpec 严格校验和补丁格式通过（202 项通过）；Ruby YAML 解析通过。

## 2. 远端发布验收

- [x] 2.1 推送后确认 GitHub Actions 的检查、发布构建、Pages 部署及部署后验收全部成功（run `42457554854`）；Action 定义使用 Node.js 24，运行摘要/注释未见 Node.js 20 弃用提醒。步骤原始日志需登录 GitHub，未能直接读取。
- [x] 2.2 核对发布清单 revision 与推送提交一致（`390e7c532a589c350d4d25e7292625a0f58694bd`）；本地和公网页面均 HTTP 200，浏览器中同一路径挑战页同时打开并归档变更。
