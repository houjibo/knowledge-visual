# 站点发布与专业化运营计划

状态：目标与实施计划，非已发布承诺。基线核查：2026-11-08。项目首先是供不同年龄学习者动手探索的可视化学习站；工程化和 AI 辅助维护服务于内容准确、学习流畅和长期可用。

## 目标

- 提供不依赖代码仓库或本地服务的公开 HTTPS 站点，有稳定可分享的首页和主题链接；在成熟后支持用户拥有的独立域名。
- 使用清楚、可重复的发布与回退流程，让每次公开更新对应经过验证的版本，并能快速发现和修复故障。
- 建立内容、体验和维护质量标准：明确学习目标、概念依据、交互反馈、可访问性、问题反馈和修复记录。
- 用 AI 辅助分析与实施，以仓库文档、OpenSpec、自动测试和可复核结果保持知识与决策可追溯。

## 当前基线
仓库 `houjibo/knowledge-visual` 为公开项目，默认分支为 `main`。GitHub Pages 已启用，站点 `https://houjibo.github.io/knowledge-visual/` 的首次可验证发布来自 `08751e6`；[Actions run 42430059152](https://github.com/houjibo/knowledge-visual/actions/runs/42430059152) 的检查、构建、部署和部署后验收均成功，公网清单匹配该提交且标记站点文件未修改。首次自动部署使用的 Jekyll 模板没有版本清单，已移除；后续由通过全量质量门禁的 Static HTML 产物唯一发布。详细范围与限制见[发布记录](../assessments/site-release-2026-11-08.md)。独立域名、域名所有权、托管成本及反馈责任尚未确定。

截至 2026-11-10，计算机与人工智能页面已发布。归档提交 `34f9a56` 的 Actions [run #208](https://github.com/houjibo/knowledge-visual/actions/runs/42739511880) 检查和构建成功，但 Pages deployment 约 10 分钟后转为 error，工作流取消且部署后 job 被跳过；公网清单已匹配该提交，直接核验确认 6 个资源可访问。job 日志接口返回 403，具体平台原因未确认。后续提交 `9f22f6a` 将部署 job 上限增至 20 分钟，并由静态守卫验证超时和后置核验依赖；Actions [run #209](https://github.com/houjibo/knowledge-visual/actions/runs/42747644282) 的检查、构建、deploy 和部署后核验全部成功，deploy 用时约 32 秒，公网清单 revision 匹配且 `site_files_modified:false`。此次复验支持更有弹性的窗口配置，但单次成功不能证明 #208 的唯一原因已隔离；继续观察后续发布。相关[归档 OpenSpec 变更](../../openspec/changes/archive/2026-11-10-stabilize-pages-deploy-acknowledgement/proposal.md)。

后续提交 `3742870` 的 Actions [run #211](https://github.com/houjibo/knowledge-visual/actions/runs/42756210604) 在 `checks` job 的 20 分钟上限处被取消，build、deploy 和部署后验证均跳过。GitHub 注释显示浏览器回归 1,646 项通过、2 项跳过，全站冒烟两轮各 339 项通过，发布包交互 6 项通过；本地 `npm run check` 完整通过。该证据说明测试结果已大部分产出，但工作流没有成功终态，不能据此称为 CI 通过。提交 `844cda0` 将 checks 上限提高到 30 分钟，并由静态守卫要求至少 25 分钟；Actions [run #212](https://github.com/houjibo/knowledge-visual/actions/runs/42759471240) 的 checks 在 13 分 22 秒完成，build-release、deploy 和部署后核验均成功，公网版本清单匹配且 `site_files_modified:false`。继续观测 CI 耗时，如果接近上限，应按新日志定位具体阻塞阶段。[归档 OpenSpec 变更](../../openspec/changes/archive/2026-11-10-stabilize-checks-job-timeout/proposal.md)。
## 分阶段执行

### 1. 构建可发布的静态产物

1. 已通过 `python3 scripts/build_site.py --output <新目录>` 从 Git 跟踪的允许目录和静态文件类型生成发布包，排除文档、测试及备份；保留原有路径。新增资源类型需更新允许清单及检查。
2. 发布包构建检查 HTML 声明的站内链接和根路径引用，并拒绝覆盖现存目录；CSS、动态路径、外链及大小写跨平台差异仍需继续检查。
3. `npm run test:release` 在独立临时目录的子路径检查首页搜索、六学科代表交互及面积到体积路线（桌面和窄屏），并对清单内全部页面进行桌面加载检查；该项不证明全站交互、知识内容或所有进度场景均已验证。
4. 构建生成 `release-version.json`，记录完整提交哈希和已跟踪站点文件是否相对该提交修改、增删；未跟踪文件不进入产物。自动部署前校验哈希与本次工作流提交一致且站点文件未修改。该清单用于定位版本，不是文件完整性证明。

### 2. 建立公开站点和发布流程

1. GitHub Pages 为首个试点：仓库公开，Pages 的 Source 已选 GitHub Actions，站点地址为 `https://houjibo.github.io/knowledge-visual/`。该选项不排除后续迁移其他静态托管服务。
2. `.github/workflows/checks.yml` 是唯一 Pages 发布者：主分支推送或手动运行先完成静态与浏览器检查，再构建带 `release-version.json` 的受控静态包，核对版本溯源后部署；拉取请求只检查。新静态守卫防止添加第二个自动 Pages 发布者。
3. 首次 Pages 发布已通过版本清单、站点资源和桌面/窄屏四学科代表学习路径核验，证据见[发布记录](../assessments/site-release-2026-11-08.md)。每次后续更新仍以部署后步骤成功且公网清单匹配当前提交为发布依据。
4. 回退候选流程：在主分支创建恢复到已知可用内容的提交，推送后等待完整检查及部署，并核验公网版本；不可直接以旧提交重新运行来保证覆盖当前版本。实际演练、缓存行为与运行记录尚待验证。

已由仓库管理员在 Settings → Pages → Build and deployment 中选择 GitHub Actions，CLI 认证不是继续发布的前置步骤。每次发布都记录版本、时间与公网验收。只有检查、构建、deploy 和部署后核验全部成功才记为自动发布完成；若 job 失败或取消，即使公网清单已经更新，也单独记录内容状态和未完成的自动门禁，不宣称流水线通过。
### 3. 独立域名与产品入口

- 先选择并确认域名的所有权、续费责任和 DNS 管理方式；接入前核查成本和服务可用性。配置域名验证、DNS 和 HTTPS，确认旧项目站链接及外部深链的处理方式。
- 当前进度按浏览器来源保存；首页支持导出主题完成记录并预览后合并导入，保留目标浏览器已有同名记录。挑战历史与最佳成绩未纳入；多键写入无法提供跨标签事务，回滚失败会明确提示。域名变更不会自动继承记录。
- 首页已补充网站简介、图标及描述元信息；分享图片、站点地图和正式域名待公开地址确定后配置。继续以真实学习路径为依据设计首页的起点、搜索、学科与学段入口。

### 4. 质量、维护与反馈

- **内容治理**：每个实质修改的主题记录适用范围、权威依据和可复现验证；高风险或未核验内容明确标注状态，给出反馈与修正路径。
- **工程与发布**：公开 CI 结果、变更记录与版本；建立自动化静态检查、真实浏览器回归和发布后巡检。依实际使用与维护能力确定可用性目标，而不是预设无法验证的 SLA。
- **可访问与适配**：持续覆盖键盘、清晰名称、焦点、减少动态效果、窄屏与必要的屏幕阅读反馈；以受影响路径的实测证据为准。
- **隐私与安全**：默认避免收集个人数据；启用统计、反馈表单或第三方脚本前明确用途、数据流与隐私说明。学习者可能为未成年人，反馈设计应避免要求不必要的身份信息。
- **运营与责任**：首页已提供 GitHub 公开问题入口及不填写敏感信息的提示；继续完善维护方式和内容更正流程；明确维护者、升级路径和依赖更新安排。成本、备份和域名续费有实际负责人后再作承诺。

## 验收与待决事项

首个公开站上线需有：公网 HTTPS 地址及提交版本；首页到至少四学科代表主题的可复现学习路径；桌面、窄屏、深层链接和搜索检查；发布成功和失败记录；回退方法；测试和内容覆盖边界。域名阶段另需验证所有权、HTTPS、旧链接及本地学习进度处理。

待确定：是否使用自有域名及其名称、域名/DNS 管理权、托管偏好、反馈渠道、服务可用性目标。无需等待这些事项即可先完成发布包和子路径验证；涉及实际域名或托管账户的操作以可用权限和明确选择为准。

参考：[GitHub Actions 工作流语法与 job 超时](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax)、[GitHub Actions 并发策略](https://docs.github.com/en/actions/concepts/workflows-and-actions/concurrency)、[GitHub Pages 发布源与 Actions](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)、[HTTPS 配置](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https)、[域名验证](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/verifying-your-custom-domain-for-github-pages)。
