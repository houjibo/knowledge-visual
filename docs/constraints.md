# 设计与工程约束

## 学习体验

- 准确性和学习目标优先：新增或调整内容须说明概念、适用范围及可核验依据，不能让动画替代解释。
- 优先让学习者观察、操作、获得反馈；适配目标年龄和现有学段风格。交互应有清楚的标签、状态和可操作反馈。
- 考虑窄屏、键盘使用、文字对比和动画可控性；针对改动实际检查，不把现有站点视为已完全达标。

## 兼容与变更

- 保持现有入口、相对路径与直接打开静态文件的使用方式，除非变更明确改变并验证该契约；避免未经必要性论证引入服务端或构建依赖。
- 先查实际页面及其共享资源，尊重各学段差异；修改共享文件要检查所有受影响页面。
- 按 [工作流](workflows/requirement-delivery.md) 记录行为变化，具体范围、设计与验收放 OpenSpec；小型无行为变更可轻量处理，并更新受影响文档。
- 不覆盖已有未提交修改；在风险相称的范围内小步修改并验证。涉及数据删除、发布等不可逆操作遵照用户授权。

## 验证

在仓库根目录运行 `python3 scripts/check_site.py`：检查 HTML 中静态声明的相对链接/资源、数学学段进度清单与导航主题的一致性、数学跨学段同名主题清单，以及物理和化学学段进度分母与主题卡片数量的一致性。`python3 scripts/check_markdown_links.py` 扫描仓库 Markdown（跳过 `.git` 和 `node_modules`），检查行内、图片及引用式链接的本地文件/目录目标；缺失或越界目标会带来源行号失败，代码示例、外部 URL 和纯片段不作为本地目标检查。`python3 scripts/check_agents_index.py` 检查根 AGENTS.md 只包含标题和仓库内 Markdown 索引，并包含架构、约束、差距、三个工作流和 OpenSpec 入口；对应回归为 `python3 tests/agents_index_test.py`、`python3 tests/markdown_links_test.py`。以上静态检查不执行 JavaScript、不检查外链可达性、Markdown 标题片段或 CSS 内引用，也不验证教学准确性和视觉效果。用 `node tests/progress.test.js` 和 `node tests/subject_progress.test.js` 运行数学及计算机/人工智能进度回归场景；`node tests/electrostatic-model.test.js` 覆盖独立静电场物理模型。两者均不代替浏览器测试。`python3 scripts/build_topic_catalog.py --check assets/topic-catalog.js` 检查首页查找目录与页面/导航是否同步；`python3 scripts/check_homepage_totals.py` 检查首页各学科进度分母与数量徽标是否匹配主题目录；可用 `openspec validate --all --strict` 检查 OpenSpec 工件。`npm run check:static` 会运行这些本地静态门禁和回归。

真实浏览器试点需要 Node.js 20.19 或更高版本，使用 `npm ci`、`npx playwright install chromium` 安装开发依赖与浏览器，然后运行 `npm run test:browser`；它启动独立本地服务器并覆盖六个学科代表路径、计算机与人工智能各自的主题交互和旧链接兼容，运行桌面与窄屏场景。可用 `KV_CHROMIUM_PATH` 指定兼容的本机 Chromium 可执行文件；运行 `npm run test:browser:smoke` 对清单中全部 HTML 做桌面浏览器加载冒烟，范围及局限见 [加载检查记录](assessments/browser-load-2026-11-07.md)。安装后运行 `npm run check` 可依次执行静态、OpenSpec、代表路径及全站加载检查；`npm run check:static` 只运行不需要浏览器的检查。浏览器安装只用于开发验证，不是静态站点运行要求。

`.github/workflows/checks.yml` 配置在推送和拉取请求时运行检查，并在主分支部署后检查公网版本、资源及代表学习路径；实际发布状态需在推送后核实，不能将本地通过视为 GitHub Actions 或公网检查通过。

CI 将 core 检查与 desktop/mobile 功能矩阵分开，保留 `test:browser` 的唯一显式测试清单和本地 `npm run check` 完整入口。`npm run check:browser-projects` 通过真实 JSON 收集核对完整清单与两项目清单的多重集合，报告数量和覆盖指纹；该预检不启动浏览器，也不替代功能执行和运行时跳过检查。稳定的 `checks` 汇总仅在全部必需上游成功时通过，构建仍须经主分支、来源及当前头校验。固定工作流结构由发布守卫及其变异回归检查，真实矩阵展开和发布结果仍以 Actions 为准。

涉及页面交互或布局时，使用静态服务器在浏览器检查受影响页面、主要操作和窄屏，并记录浏览器、结果及未测范围；内容修改还需核验知识依据。检查失败要记录原因，不能用删减标准掩盖失败。
