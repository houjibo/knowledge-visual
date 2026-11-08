## 1. 固定 CI runner 版本

- [x] 1.1 将 `.github/workflows/checks.yml` 四个 job 的 `runs-on` 统一改为 `ubuntu-26.04`；`rg` 确认四处标签正确且不再使用 `ubuntu-latest`。
- [x] 1.2 运行 `npm run check:static`、Ruby YAML 解析和 `git diff --check`，确认 202 项静态/OpenSpec 校验、YAML 语法和补丁格式通过。

## 2. 验证迁移目标并归档

- [x] 2.1 推送后确认检查、发布构建、Pages 部署和部署后验收全部成功（run `42460966151`）；四个 job 的 runner labels 均为 `ubuntu-26.04`，检查有 1318 项通过、2 项跳过和 330 页冒烟通过。
- [x] 2.2 核对发布清单 revision 为 `6afb0d8f952ed04da71a1776bbe9922595f49760`，与推送提交一致；本地和公网页面均 HTTP 200，已记录剩余差距并归档变更。
