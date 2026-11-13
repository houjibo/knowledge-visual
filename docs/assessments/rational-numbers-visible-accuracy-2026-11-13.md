# 初中有理数页面可见准确性核查

日期：2026-11-13。依据[教育部义务教育数学课程标准（2022 年版）](https://www.moe.gov.cn/srcsite/A26/s8001/202204/W020220510531636118932.pdf)第四学段“数与式／有理数”和[五条要求的首轮映射](middle-math-rational-crosswalk-2026-11-13.md)。行为契约见[归档 OpenSpec 变更](../../openspec/changes/archive/2026-11-13-middle-rational-numbers-visible-accuracy/proposal.md)。

此处课程映射是 2022 版历史快照；[2025 版标准](../plans/compulsory-2025-standard-version-audit.md)尚待逐条重核，页面交互验收结论仍按当时测试记录保留。

## 已改行为及教学边界

- 温度演示统一为 -50—100°C，100°C 按钮和最高刻度、滑块、填充高度一致；0°C/100°C 的水相变示例注明标准大气压，不再用错误的“比地球上任何地方都冷”描述。
- 绝对值可视窗为 -10—10；越界或空值保留上次有效图示并给出文字反馈，正、负、零的距离均用数轴和文字说明。
- 四则计算器只解析本页按钮组成的十进制数、括号、负号与加减乘除；除零和无效算式明确失败，0 的结果不称为正或负；循环小数保留六位并标出近似。三道固定预测题覆盖 `−3+5`、`(−2)×(−3)`、`0×(−4)`，错答可重试。
- 新完成门槛要求三个不同数轴点、相反数展示、三个不同有效绝对值和三题正确预测；已有完成记录不删。完成只表示本页探索，不代表课标五条全部达成。进度写入失败由共享保存提示提供重试。

## 验证记录

- 纯模型：`node tests/rational-number-model.test.js`，3 项通过；覆盖带符号整数、括号、优先级、11×11 加乘与非零除法、零的符号、近似和非法输入。
- 桌面/移动专项：`npx playwright test tests/browser/middle-rational-numbers-visible-accuracy.spec.js --project=desktop --project=mobile`，8 项通过；检查键盘温度示例、刻度同步、绝对值越界、运算错误与结果、重复探索不计数、预测错答、保存拒绝及恢复、320px 和 `file://` 直接打开。320px 温度与运算页面截图已目视检查。
- 完整 `npm run check` 通过：功能浏览器 2,224 项通过、6 项按配置跳过；开发和发布包各 379 页加载，发布包 22 项关键流程通过。严格 OpenSpec 检查包含本变更。
- 主分支提交 `aba3530` 的 [Actions #43391282613](https://github.com/houjibo/knowledge-visual/actions/runs/43391282613) 七项作业全部成功；公开 `release-version.json` 的修订号为 `aba353055459834306606ac3336a70514c92d03f`。
- 公网专项：`KV_PUBLISHED_BASE_URL=https://houjibo.github.io/knowledge-visual/ npx playwright test tests/browser/middle-rational-numbers-visible-accuracy.spec.js --project=desktop --project=mobile --workers=2`，温度/绝对值与运算器的桌面、移动操作 4 项通过；本机存储注入和 `file://` 的 4 项按测试配置跳过，已在本地专项验证。公网与本地页面均已打开供验收。真实课堂理解、实机和整页屏幕阅读器未验收。

后续仍需数轴大小比较、不同数的相反数判断、乘方意义、运算律和实际问题列式；这些保持[课程对照](../plans/curriculum-crosswalks/middle-math-rational-numbers.json)的部分或缺失状态。
