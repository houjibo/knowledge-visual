# GitHub Pages 首次可验证发布

- 站点：https://houjibo.github.io/knowledge-visual/
- 提交：`08751e637028e5842ae86de41fc1235f5be1bbe6`
- GitHub Actions：[项目检查与发布 run 42430059152](https://github.com/houjibo/knowledge-visual/actions/runs/42430059152)
- 结果：`checks`、`build-release`、`deploy`、`verify-deployment` 均为 success。
- 公网清单：`release-version.json` 的 revision 与该提交一致，`site_files_modified` 为 `false`。
- 发布构建：受控静态包包含 390 个已跟踪站点文件。
- 范围：流水线完成静态、全量浏览器、发布包资源和提交溯源检查，并完成桌面与窄屏代表学习路径验收；不表示 330 个主题的全部教学内容、真实设备、整页无障碍、回退演练或自有域名均已验收。

该次发布移除了与项目发布流水线竞争的 Jekyll 模板，后续 Pages 自动部署由完整质量门禁后的 Static HTML 产物唯一负责。
