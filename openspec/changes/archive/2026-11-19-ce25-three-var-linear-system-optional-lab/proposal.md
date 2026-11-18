## Why

CE25 初中数学第四学段“方程与不等式”交叉表 `middle-math-equations-inequalities-ce25.json` 中，11 条里唯一的 missing 是 `CE25-MATH-L4-EQI-EQ-04`“求解简单的三元一次方程组（选学）”。现有 `math/middle/linear-equations-2var.html` 只覆盖二元一次方程组的代入/加减消元，没有三元任务；大学 `math/uni/plu-elimination.html` 是矩阵 PLU 分解，定位不同。该条 `course_requirement` 为 optional、明确不作为考试要求，核查记录已决策“选学单列、不抢占必学”，因此本变更作为**必学之后的选学补充**，把它从 missing 推进到 partial，而非宣称覆盖必修。

## What Changes

- 新增初中数学选学页 `math/middle/three-var-linear-system.html`，沿用数学学科独立的三模式（学习/求解/测验）与 `kv-math-progress` 进度，围绕“三元→消元成二元→再消元成一元”的化归思想。
- 纯模型 `three-var-linear-system-model.js`：对固定的整数系数三元方程组做加减消元求解与整数解校验，含唯一解、可消元步骤与输入合法性（拒绝非有限数、注入字符串）。
- 学习模式讲清两次消元的步骤与“消元化归”核心；求解模式给有限的固定方程组、三未知数输入与逐步反馈；测验为固定小题。
- 全程本地固定脚本，不连接外部服务、不发送网络请求、不收集自由文本；页面显著标注“选学内容，不作为考试要求”。
- 将 `CE25-MATH-L4-EQI-EQ-04` 从 `missing` 调整为 `partial`（选学消元任务的本地固定案例，未覆盖开放式真实情境与课堂教学，故不升 verified）；方程与不等式交叉表随之变为 11 部分、0 缺失。
- 补充纯模型 Node 用例与浏览器回归（加载、求解反馈、键盘、文件直开）；数学学科计数（首页数学 total、差距矩阵初中数学 35→36、页面清单）同步。

## Capabilities

### New Capabilities

- `middle-three-var-linear-system-optional`: 在固定整数系数三元方程组上演示两次消元化归为一元的求解，并提供整数解校验与选学边界说明，全程本地脚本。

### Modified Capabilities

无。

## Impact

影响 `math/middle/` 的新页面与本地模型、数学初中目录卡片、主题目录与页面清单生成件、首页数学学科计数（数学 216→217）、方程与不等式 CE25 交叉表、课程差距矩阵与核查记录、模型 Node 测试和浏览器回归；不新增外部服务、依赖或网络请求，不改变任何既有 URL、进度结构或其他学科计数，也不影响计算机/人工智能学科。
