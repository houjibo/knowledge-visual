## Context

见 proposal.md - Why。页面已通过 `PageProgress.markDone('complex-numbers')` 保存完成状态；此 API 返回布尔结果，失败时公共工具会创建带重试按钮的状态提示，并在重试成功后派发 `math-progress-saved` 事件。当前题目按面板保存在内存中，题组切换时重新渲染。

## Goals / Non-Goals

**Goals:**

- 让语义化控件和现有题目状态共同承担键盘、屏幕阅读器与回看反馈。
- 复用公共进度保存与重试机制，不另建存储格式。
- 以桌面和移动浏览器用例锁定十道题及保存成功、失败分支。

**Non-Goals:**

- 不把单题答题记录跨刷新持久化；完成记录仍只表示本页十题全部答对。
- 不重写复数动画、画布或全站公共进度服务。

## Decisions

1. **用原生按钮表示选项。** 现有可点击 `div` 不能获得原生键盘操作或按钮语义。按钮内保留原有文本与样式，并提供 `aria-pressed`；题目容器以题干作为可访问名称，反馈用 `role="status"` 和 `aria-live="polite"`。这比自建 ARIA button 的键盘行为简单，也避免额外依赖。
2. **沿用会话内 Set 记录已掌握题目。** 切换题目时从该集合恢复正确选项和掌握反馈，重复作答按题目索引去重。替代方案是将每题答案写入浏览器存储；该页现有进度合同只需要整页完成，扩展持久数据会增加不必要的迁移和清理要求。
3. **以保存 API 返回值和重试事件驱动完成文案。** 初次全部答对时检查 `markDone` 的布尔结果；若失败，明确显示未保存。只在 `math-progress-saved` 事件后将反馈改为已保存，避免把页面完成与持久化成功混为一谈。
4. **用官方教材作为题库核对依据。** 十题答案回归覆盖复平面坐标与模、共轭、`i² = −1`、复数加乘以及乘以 `i`、`−1` 和实数的几何含义；运算规则参考 [OpenStax Algebra and Trigonometry 2e §2.4](https://openstax.org/books/algebra-and-trigonometry-2e/pages/2-4-complex-numbers)，复数乘法的模与辐角几何解释参考 [§10.5](https://openstax.org/books/algebra-and-trigonometry-2e/pages/10-5-polar-form-of-complex-numbers)。

## Risks / Trade-offs

- [重访答案按钮可能被误解为可切换选择] → 用 `aria-pressed` 明确状态、视觉上标记正确项，并保留题目反馈与唯一掌握数。
- [公共保存事件可能来自当前页面其他完成记录] → 仅在本页练习已全部答对后更新本页完成反馈；事件前仍展示未保存状态。
- [浏览器测试不能等同真实屏幕阅读器或触屏设备验证] → 报告中明确限定为桌面及移动视口自动化覆盖，不声称真实设备验收。

## Migration Plan

直接替换题目选项标记和交互，不改变 URL、题库内容结构或进度键。若回归出现问题，可回退本次页面和测试提交；既有 `high:complex-numbers` 完成记录格式保持兼容。
