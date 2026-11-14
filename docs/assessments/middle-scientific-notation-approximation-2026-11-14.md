# 初中科学记数法与近似数：局部学习证据

核查日期：2026-11-14。依据为[义务教育数学课程标准 2025 年日常修订版](https://fxzx.qpedu.cn/wcm.files/upload/CMSfxzx/202603/202603180320047.pdf)第四学段“数与式”内容要求：印刷页 54—55 的“实数”第⑦项涉及近似数和近似计算，印刷页 55 的“代数式”第④项涉及整数指数幂与科学记数法。[人教版现行七上课例](../plans/pep-middle-math-2025-lesson-source-audit.md)把两者列于第二章 `2.3`，仅作教材编排线索。变更契约见[OpenSpec](../../openspec/changes/middle-scientific-notation-approximation/proposal.md)。

## 学习任务与可核验边界

- [新主题](../../math/middle/scientific-notation-approximation.html)给出四个虚构十进制数：`72 500 000`、`0.000056`、`−384 000`、`0.00000072`。学习者输入系数和整数指数，可先展开，再检验是否**精确等值且系数规范**。等值但系数不在 `1 ≤ |a| < 10` 的范围时给出独立反馈。正确后逐位展示小数点移动；零只在概念提示中作为特殊情况。
- 四个虚构记录要求按 `0.1 m`、`0.01 km`、千位及 `0.001 g` 取近似数。数轴标出相邻候选刻度和原数位置；提交后解释下一位、进位和 `≈`。`7.995 km` 按百分位得到 `8.00 km`，保留两位小数。纯模型用十进制整数位数运算，避免二进制浮点在半值附近的误判。
- 页面只有在独立完成正、负指数各一例和两种不同精度的近似数后尝试写入本机完成状态；查看示例的题不计入。页面数和课例数不进入课程标准条目分母。

## 课程映射

[两条 CE25 内容要求映射](../plans/curriculum-crosswalks/middle-math-scientific-approximation-ce25.json)当前为 **0 已验证、2 部分**。近似数条目仍缺计算器操作、由学习者选择精度、测量误差及多样实际问题；科学记数法条目仍缺整数指数幂性质、计算器 E 记法与迁移任务。现有[有理数五条映射](../plans/curriculum-crosswalks/middle-math-rational-numbers-ce25.json)保持原口径；第四学段其余数学内容要求、学业要求与阶段质量尚未完整映射，不能推算全站覆盖率。

## 验证记录

- `node tests/scientific-approx-model.test.js` 检查精确等值、非规范、正负指数、半值进位、目标位数及无效输入。
- `npx playwright test tests/browser/middle-scientific-notation-approximation.spec.js --project=desktop --project=mobile`：8/8 通过，含错误重试、示例不计进度、存储失败重试、目录和搜索、320px、键盘、文件直开与发布子路径。
- 完整 `npm run check` 通过：静态/课程映射/OpenSpec 严格校验及项目矩阵预检；功能浏览器 2,252 项通过、6 项按配置跳过，开发站 381 页、发布包关键流程 22 项和发布包 381 页加载通过。桌面与 320px 已目视检查；原首页示例曾显示两道练习答案，已改成不同数字，并在改动后重跑专项。
- 主分支 Actions、公网版本和公开学习路径待本次推送后核对；不把本地门禁视为公网已验收。

未覆盖真实学习者理解、完整屏幕阅读器朗读、实际测量误差及教材完整版小节目录。
