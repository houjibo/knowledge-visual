## Context

仓库目前有基线、页面清单、OpenSpec 规格、浏览器测试和模拟 DOM 测试；全部依靠手动执行，浏览器检查需本地服务与 Chromium。

## Goals / Non-Goals

让本地和 CI 使用相同顺序的可重复检查，并明确失败；不暗示远端已执行，也不将现有检查当作全部教学和交互的验收。

## Decisions

在 npm scripts 中组合现有检查，并将 OpenSpec 固定为开发依赖；保留原有独立命令。GitHub Actions 使用只读仓库权限，安装锁定依赖及 Playwright Chromium，以两工作进程依次运行代表路径和桌面加载冒烟。失败时上传测试诊断，限制保存时间。CI 的浏览器与 Linux 环境需首次远端执行才能确认。

## Risks / Trade-offs

全站冒烟运行时间较长且存在随机输入和机器差异；不以重试掩盖失败。CI 依赖包注册表和浏览器下载服务；本轮无法推送验证 GitHub Actions。
