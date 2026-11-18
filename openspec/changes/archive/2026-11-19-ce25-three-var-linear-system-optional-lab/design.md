## Context

动机与可观察行为见 [proposal.md](proposal.md) 与 [spec.md](specs/middle-three-var-linear-system-optional/spec.md)。数学学科页面（`math/middle/`）使用与计算机/AI 不同的独立 quiz 体系：三模式（学习/求解/测验）、内联或独立 `KV...Model`、`data-check` 求解、`kv-math-progress` 进度，不进 `check_site.py` 的 `subject_topics` 字典，重名检测由 `check_math_conflicts` 自动 glob。

CE25 方程与不等式交叉表 EQ-04 是标星选学三元一次方程组，next_step 要求“在必学基础内容之后评估选学消元任务，不将其缺失称作必修缺口”。本页定位为必学二元消元之后的选学化归训练。

## Goals / Non-Goals

**Goals:**

- 让学习者理解三元一次方程组的求解核心：两次消元，把三元化为二元、再化为一元。
- 在固定整数系数方程组上提供可核对的求解与整数解校验。
- 保持数学页三模式与本地、无外部请求的一致体验，并显式标注选学边界。
- 新 slug 与现有页面不重名，避免触发 `AMBIGUOUS_MATH_SLUGS` 冲突。

**Non-Goals:**

- 不覆盖矩阵、行列式、PLU 分解等大学内容（那是 `math/uni/plu-elimination` 的范围）。
- 不做自由输入任意系数的通用求解器，只处理有限的固定教学案例，保证确定性与可测试。
- 不处理分数解、无解/无穷解的完整分类，选学案例均设计为整数唯一解。
- 不宣称覆盖课堂教学或开放真实情境，交叉表只推进到 `partial`。

## Decisions

1. **化归为主线。** 每个案例展示“消去同一未知数→得二元组→再消元→一元求解→回代”的固定步骤，与二元页的消元思想衔接。
2. **独立纯模型。** `three-var-linear-system-model.js` 暴露固定案例、参考解与 `checkSolution(caseId, {x,y,z})`，Node 与浏览器共用；输入校验拒绝非有限数与注入字符串。
3. **三模式沿用数学页契约。** 学习模式讲步骤；求解模式用三个数字输入 + `data-check` 按钮给逐步/对错反馈；测验为固定小题。
4. **选学边界显式化。** 页面顶部与元信息标注“选学内容，不作为考试要求”，避免与必学混淆。
5. **唯一 slug。** 文件名 `three-var-linear-system.html`，与 `linear-equations-2var`、大学 `linear-systems` 均不同名，重名检测无需改动。
6. **进度复用数学学科。** 完成判定写入 `kv-math-progress`，不新增进度键或学科。
7. **计数由清单驱动。** 新页注册进 `page-inventory.json` 后自动进入 smoke；首页数学 total 与差距矩阵初中数学计数同步 +1，computer/ai 不动。

## Risks / Trade-offs

- [固定案例代表性有限] → 选学定位下用少量典型整数解案例讲清化归即可，通用求解超出初中选学要求。
- [与二元页内容可能重叠] → 本页聚焦“两次消元”的三元特性，二元页只作前置链接，不重复其几何/无解内容。
- [选学被误当必修] → 页面、OpenSpec、核查与交叉表 gap 四处标注选学与 partial 边界。

## Migration Plan

不删除任何既有 URL 或进度结构。新增页面与模型，经清单/目录生成注册，更新唯一的 EQ-04 交叉表条目与数学计数，运行模型 Node 测试、浏览器回归与静态检查，推送后核验 Pages 并归档。回滚方式为回退该功能提交。
