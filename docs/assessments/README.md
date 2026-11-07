# 站点评估基线

[页面清单](page-inventory.json) 于 2026-11-07 从当前仓库生成：包含 330 个 HTML 文件，其中 316 个按目录规则归为主题页、14 个归为导航页；从首页沿静态 HTML 链接可到达全部 330 个。此结果反映当时的文件和链接图，不等于所有主题均有正确的交互或已验证的内容。

重新生成：`python3 scripts/inventory_pages.py --output docs/assessments/page-inventory.json`；运行 `python3 scripts/inventory_pages.py --check docs/assessments/page-inventory.json` 检查清单是否过期，运行 `python3 tests/inventory_test.py` 验证基本解析及导航行为。生成结果按路径稳定排序，无时间戳，可用版本差异检查变化。

- `subject`、`stage` 和 `kind` 按路径归类；数学小学知识地图本身是导航页、主题目录中的 `index.html` 是主题页。无法由路径判断时值为 null。
- `static_signals` 是原始 HTML 中控件和图形标签的数量，不判断可操作性；脚本动态生成的控件不会出现。
- `static_reachability` 仅依据首页的静态相对或根路径 HTML 链接计算。`not-reached` 是调查线索，动态链接、脚本导航及其他入口可能存在，不能据此删除页面。
- `functional_verification: unverified` 表示这份静态清单不提供功能验收证据，并非声称每页已经经过人工检查。具体浏览器与知识核验应在独立记录中关联页面、环境、操作和结果。

浏览器执行、动态资源、CSS、外链、屏幕适配、无障碍和科学准确性均不在此清单的验证范围内。真实浏览器冒烟及代表性学习路径仍需单独实施。

四条代表路径的桌面浏览器抽查见 [浏览器试点记录](browser-pilot-2026-11-07.md)。

[全站浏览器加载检查](browser-load-2026-11-07.md)记录了 330 页加载基线及发现的问题。

[扇形统计图主题检查](pie-chart-2026-11-07.md)记录了比例、题目和估算提示的验证。

[数学进度学段隔离](math-progress-2026-11-07.md)说明旧数据处理、验证与回退限制。

[首页主题查找试点](site-search-2026-11-07.md)记录目录生成、验证及范围。

[主题交互证据索引](interaction-coverage.md)将已登记的部分浏览器测试关联到主题，并列出尚未登记的主题；证据分组在 `interaction-evidence.json` 中维护。修改后运行 `python3 scripts/interaction_coverage.py --output docs/assessments/interaction-coverage.md`；静态检查验证引用的主题、测试文件、测试入口及生成结果。测试存在或本索引被更新均不代表本次测试通过或主题已验收。

[交互风险线索](interaction-risks.md) 以静态 div 控件和内联 `while` 为线索，辅助选择下一项调查；它不判断实际可访问性或循环是否会终止。运行 `python3 scripts/interaction_risks.py --output docs/assessments/interaction-risks.md` 更新，`--check` 检查是否与当前文件一致；详情和漏报范围见报告。
