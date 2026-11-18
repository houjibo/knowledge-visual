# 初中三元一次方程组选学实验室核查

日期：2026-11-19。对应 CE25 义务教育数学第四学段“方程与不等式”交叉表 `middle-math-equations-inequalities-ce25.json` 的 `CE25-MATH-L4-EQI-EQ-04`“求解简单的三元一次方程组（选学）”。该条 `course_requirement` 为 optional，2026-11-16 核查已确立“选学单列、不抢占必学、不称作必修缺口”的处理原则，本次作为必学二元消元之后的选学补充。

## 选学边界

- 页面、OpenSpec、本核查与交叉表 gap 均标注“选学内容，不作为考试要求”，不计入必修达成。
- 仅覆盖固定整数系数案例的两次消元化归，不含通用求解器、分数解、无解/无穷解分类与开放真实情境，故为部分覆盖（partial），不升 verified。
- 与大学 `math/uni/plu-elimination.html`（矩阵 PLU 分解）定位不同，不重复其内容；前置链接到必学的 `linear-equations-2var.html`。

## 页面任务与证据

新增[三元一次方程组（选学）](../../math/middle/three-var-linear-system.html)，沿用数学学科三模式（学习/求解/测验）：

1. **学习模式**：三个固定整数案例展示“消去同一未知数→二元方程组→再消元→一元求解→回代检验”的化归步骤。
2. **求解模式**：对每个案例输入 x、y、z 三个整数，模型校验是否等于参考解；错误给逐项提示，非法输入（空值、非有限数、非整数、注入字符串）返回无效状态。
3. **测验模式**：由案例派生 4 道固定小题，按 75% 通关线给反馈。

模型位于 `math/middle/assets/three-var-linear-system-model.js`（UMD，全局 `KVThreeVarLinearSystemModel`），Node 用例覆盖参考解满足全部方程、正确/错误/非法输入、未知案例与对象冻结。浏览器 spec 覆盖选学标注与前置链接、求解校验、测验、320px 键盘、文件直开与发布子路径离线加载。

## 交叉表结论

`CE25-MATH-L4-EQI-EQ-04` 从 `missing` 调整为 `partial`。至此“方程与不等式”11 条内容要求全部达到部分覆盖（0 已验证、11 部分、0 缺失），但无一条 verified（verified 需课堂学习等真实证据）。数学学科主题计数随新页 +1（首页数学 total 216→217、差距矩阵初中数学 35→36、页面清单 420→421），不影响计算机、人工智能等其他学科。

## 未覆盖与后续

选学的开放真实情境、课堂教学证据与更一般的求解方法仍待补；若需 verified，须另立含学习者反馈的工作流，而不是继续增加固定脚本案例。

## 公开验收

功能提交 `db3c63b` 与测试修复提交 `bbfd7971d6b19e5227866222fd86a6feb5e0ca58` 已推送至 `main`。GitHub Actions [run #44358787042](https://github.com/houjibo/knowledge-visual/actions/runs/44358787042) 的 core checks、桌面/移动浏览器回归、构建、Pages 部署和 `verify-deployment` 七个 job 均成功（首个 feat 运行因 math-progress 与 scientific-notation 两个 spec 硬编码数学初中阶段分母“1/35”而失败，已在修复提交中同步为 1/36 并全量复跑通过）。本地全量回归桌面 2,254 项、移动 2,250 项通过，跳过项均为公网门控；全站加载冒烟 421/421；发布门禁退出 0。公开 `release-version.json` 的 revision 与修复提交一致、`site_files_modified` 为 `false`；新页面与模型脚本返回 HTTP 200 且与提交逐字节一致。公网受控浏览器确认选学标注可见、case-1 整数解反馈正确、无第三方请求、无页面错误。[OpenSpec 变更归档](../../openspec/changes/archive/2026-11-19-ce25-three-var-linear-system-optional-lab/proposal.md)。
