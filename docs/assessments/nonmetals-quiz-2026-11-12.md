# 非金属互动练习核查

## 问题证据与修复范围

2026-11-12 浏览器复现：第一题答对得到 1 分，前进后返回再答同一题会得到 2 分；切换主题也会清除答案锁定。原第五题同时提供 Al(OH)₃ 和 NaHCO₃，却把前者判为错误。原选项为无法聚焦的 `div`，已存完成徽标没有如实区分保存失败。

本轮仅调整五题练习：原生答案按钮记录本轮首次选择，返回或切换保留反馈；未答不可前进；完整五题主动结束后以 3/5 门槛尝试保存。成绩和历史完成分开呈现，重做不清除历史记录，失败提供重试。元素卡片、转化项的键盘操作与整页动画另行处理。

## 知识核验

第五题改为指定“与足量稀盐酸放出 CO₂，且与 NaOH 溶液生成 Na₂CO₃”，现有四项中仅 NaHCO₃ 同时满足。反馈保留 Al(OH)₃ 可与强酸、强碱反应的正确认识。

- [OpenStax Chemistry 2e 14.1](https://openstax.org/books/chemistry-2e/pages/14-1-bronsted-lowry-acids-and-bases)说明 HCO₃⁻ 既可给出也可接受质子；据此推导 `NaHCO₃ + HCl → NaCl + CO₂↑ + H₂O` 与 `NaHCO₃ + NaOH → Na₂CO₃ + H₂O`，逐项核对原子数和电荷守恒。
- [UW–Madison 化学演示](https://demolab.chem.wisc.edu/acids-and-bases-amphoteric-properties-of-aluminum-hydroxide/)明确 Al(OH)₃ 沉淀可溶于强酸或强碱，证明原题条件不充分。

核验方式：由代理阅读上述大学教学资料并检查本次题设、选项和反馈；不据此宣称整页已完成教学审校。

## 本地验证

环境为 Playwright 1.65.0 的 Chromium，1280×720 桌面与 390×844 移动模拟，并额外检查 320px 及直接文件模式；移动模拟不代替实机或屏幕阅读器测试。

- `npx playwright test tests/browser/nonmetals-quiz-reliability.spec.js tests/browser/high-chemistry-nonmetals-tabs-accessibility.spec.js --workers=4`：30/30 通过。
- 新增回归覆盖唯一答案及配平反馈、Tab/Enter/Space、触屏、首次选择锁定、往返/切主题、0/5、2/5、3/5、5/5、回看/重做、保存失败恢复、损坏原文、历史记录保留、320px 与无外部请求的 `file://` 完成路径。
- 首轮专项 26 通过、4 失败：测试用程序聚焦后直接断言 `:focus-visible`，未进入键盘模态；另对完成徽标断言过于精确，漏了“已保存”说明。改为实际 Tab 导航验证焦点，并断言完成与保存语义后，30/30 通过。
- 完整 `npm run check` 通过：严格 OpenSpec 247 项（含本轮活跃变更）、交互回归 1812 通过与 2 项按配置跳过、开发站 360 页加载、发布包路径专项 6 项与发布包 360 页加载。
- 独立审查另以 `file://` 验证 `getItem` 完全拒绝时，3/5 仍可完成但显示未保存；重做为 0/5 后无虚假完成徽标，原文为 null，无脚本错误。
- 本轮公开部署尚待推送后的 Actions 与公网功能核验，未将本地通过表述为公开发布通过。

当前契约与任务见 [OpenSpec 变更](../../openspec/changes/2026-11-12-nonmetals-quiz-reliability/README.md)。
