## 1. 公网验收重试策略

- [x] 1.1 为公网 `published-site.spec.js` 设置无缓存请求，并断言练习面板实际激活；本地发布包真实点击回归通过
- [x] 1.2 仅为部署后的浏览器命令配置一次 Playwright 重试；工作流差异确认部署前 `npm run check` 保持零重试

## 2. 变更归档

- [x] 2.1 使用已安装 Chrome 运行 `npm run test:release`（6 项交互及 330 页冒烟通过），运行 `npm run check:static` 和 `openspec validate --all --strict` 通过
- [x] 2.2 推送后检查 GitHub Actions 的公网版本和代表学习路径作业；run `42439238247` 全部成功，公网清单匹配 `dcc69c0`
- [x] 2.3 公网验证通过后归档 `published-site-smoke-readiness`，并确认 Git 工作区与归档状态正确
