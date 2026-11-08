## Context

页面 `physics/high/motion.html` 现有练习每次随机渲染一道题，答案是可点击的 `div`；每次点击正确选项都会递增全局计数，没有逐题锁定或本轮边界。页面已有 `PageProgress.markDone('motion')` 持久化入口。本变更仅调整此页面练习，不改造相邻高中物理页面。

## Goals / Non-Goals

**Goals:** 固定五题练习顺序；保留切换模式时的题目状态；使用原生按钮和状态播报；按三道不同题完成进度；用真实浏览器覆盖桌面与窄屏。

**Non-Goals:** 调整题目知识内容、重做运动模型画布、扩展跨设备学习记录、改变存储格式或建立全站通用测验框架。

## Decisions

- 将题库和本会话状态提升到面板渲染函数之外，使用题目索引、当轮答案映射、当轮正确数和会话内已掌握题目集合，避免每次切换面板时随机丢失进度。
- 以一题一屏呈现并按固定顺序前进；提交后禁用全部答案按钮，答完第五题再显示本轮摘要和“再练一次”。重练清空当轮答案，不清空已掌握题目集合。
- 每题使用原生 `<button>`，状态区使用 `role="status"`/`aria-live="polite"`，保留浏览器默认 Enter/Space 激活行为。
- 达到三道不同题只调用一次现有 `PageProgress` 接口；已保存状态仍由共享的高中物理进度模块管理。

## Risks / Trade-offs

- 本会话的题目掌握集合不跨刷新持久化；现有契约只要求点亮知识点，不提供题目级掌握存档。
- 自动化浏览器可以验证语义与键盘交互，但不替代真实屏幕阅读器和设备验收。

## Validation

- 本轮题面中将 v-t 图像面积明确为“有向面积”；OpenStax Physics 2.4 说明速度—时间图像下的面积表示位移，教材积分章节进一步指出净有向面积计入运动方向：[Velocity vs. Time Graphs](https://openstax.org/books/physics/pages/2-4-velocity-vs-time-graphs)、[The Definite Integral](https://openstax.org/books/calculus-volume-2/pages/1-2-the-definite-integral)。
- 专项 Playwright：固定顺序、答错与重复触发、逐题锁定、模式切换恢复、键盘操作、三道不同题完成、重练及只写入一次。
- 对变更页面运行桌面与窄屏场景，检查无横向溢出、题目按钮和状态反馈可见。
- 运行 `npm run check:static`、`npm run test:browser`、`npm run test:browser:smoke` 和 `npm run test:release`。
