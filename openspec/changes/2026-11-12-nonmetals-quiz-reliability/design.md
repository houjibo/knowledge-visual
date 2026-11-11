## Context

浏览器审计已复现：第一题答对得 1 分，下一题→上一题→再次答对变为 2 分；第五题选 Al(OH)₃ 会被判错。代码的 `loadQuiz()` 每次重置 `quizAnswered`，但 `quizScore` 跨加载累加；独立正确题集合又在未完整作答时触发完成。本轮集中修复练习，保留其他主题的现有行为。

## Goals / Non-Goals

目标是唯一可解释答案、完整回合计分、可键盘作答、可回看和重做，以及诚实的进度保存状态。其他元素卡片和转化项仍需独立修复；本轮不重写整页动画或共享进度模块。

## Decisions

- 用长度为五的首次选择数组作为本轮唯一真相，从数组计算已答数和得分；不保留独立累加分数或跨回合正确题集合。
- 原生答案按钮作答后锁定，并同时用文字标识首次选择、正确答案和结果；题目导航及主题切换只渲染现有状态。
- 保留原有 60%（3/5）完成门槛，但必须完整作答并主动结束后保存。显示结果后仍可回看；重新练习仅清本轮状态。
- 始终以 `PageProgress.markDone` 的返回值判断这次保存结果，失败时可重试；不把 `isDone` 的内存缓存视为成功落盘的证据。
- 第五题指定 CO₂ 和 Na₂CO₃ 产物，配平 NaHCO₃ + HCl → NaCl + CO₂↑ + H₂O、NaHCO₃ + NaOH → Na₂CO₃ + H₂O，避免同时包含 Al(OH)₃ 的宽泛酸碱问题。

## Knowledge Evidence

- [OpenStax Chemistry 2e 14.1](https://openstax.org/books/chemistry-2e/pages/14-1-bronsted-lowry-acids-and-bases)：HCO₃⁻ 可给出或接受质子；依据所给酸碱物种推导两条反应并核对原子、电荷守恒。
- [UW–Madison 化学演示](https://demolab.chem.wisc.edu/acids-and-bases-amphoteric-properties-of-aluminum-hydroxide/)：Al(OH)₃ 沉淀可溶于强酸或强碱，证明原题并非唯一答案。
- 2026-11-12 由代理依据两份大学教学资料核对本次修改的第五题；未将此检查外推为整页知识审校。

## Risks / Trade-offs

首次作答锁定意味着修改答案须重新练习，页面须提前说明规则。已保存的旧完成记录保留，当前低分不撤销历史完成。现有共享进度模块在异常存储时保留内存状态，本页必须独立呈现保存反馈。自动化测试覆盖回合、键盘和窄屏，真实屏幕阅读器及设备仍待后续验证。

## Validation

专项桌面/移动测试检查唯一答案、首次选择锁定、反复返回/主题切换、全错/2/5/3/5/5/5、回看、重做、写入失败恢复、损坏原文和 320px。继续运行已有页签专项与完整 `npm run check`，提交后核实 GitHub Actions、部署 revision 与公网页面。
