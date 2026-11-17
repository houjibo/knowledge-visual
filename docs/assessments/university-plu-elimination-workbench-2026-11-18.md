# 大学数学：消元、行交换与 PLU 有限工作台核查

日期：2026-11-18。依据 [MIT 18.06SC《Factorization into A = LU》](https://ocw.mit.edu/courses/18-06sc-linear-algebra-fall-2011/pages/ax-b-and-the-four-subspaces/factorization-into-a-lu/)和[行交换讲义](https://ocw.mit.edu/courses/18-06sc-linear-algebra-fall-2011/33b21afab62ea8df6c7bd241240df60d_MIT18_06SCF11_Ses1.5sum.pdf)：消元乘数写入 L，需要交换行时用置换矩阵 P 表示 `PA=LU`。MIT 课程只作本站大学数学基础轨公开参考，不是全国统一课标。

## 可观察学习任务

- [工作台](../../math/uni/plu-elimination.html)允许编辑 3×3 整数 A（−3..3）和右端 b（−4..4），先预测第一轮主元来自原哪行、交换后的两个乘数、det(A)、唯一性及可逆时的 x₁。逐项反馈，修正后展示步骤；仅可逆案例全对才记进度，主动揭示和单独完成奇异分支不记进度，编辑清除旧结果。
- 每列按当前行以下绝对值最大选主元，平局取上方行；对每轮显示换行、乘数与 U。换行时同步移动 L 已完成的乘数。最终以精确有理数列出 P、L、U，逐项核对 `PA=LU`，用换行奇偶和 U 对角线核验行列式；秩另由三阶行列式及二阶子式判定。
- 可逆时用 `Ly=Pb` 前代、`Ux=y` 回代并验证 `Ax=b`。奇异时只断言**没有唯一解**，不根据秩擅自断言给定 b 无解或有无穷多解；首列全零也不制造主元或乘数。

## 验证记录

- `node tests/plu-model.test.js`：6007 个精确矩阵案例，独立计算行列式、二阶子式秩、Cramer 解与首列主元；另核两轮换行、L 旧乘数、分数、平局、零首列、零矩阵和无效输入。
- 桌面／移动浏览器专项 8/8 通过，覆盖先错后改、主动揭示、完整步骤、两轮换行、奇异、零首列、320px、键盘、目录、文件直开与发布包子路径。Chromium 1100px 与 320px 实际截图检查了编辑面板、答案卡片和公式文本；两种宽度均无横向溢出。
- 完整 `CI=1 npm run check` 通过：2686 项浏览器功能回归通过、8 项按配置跳过；开发站与发布包各 410 页加载通过，发布包功能专项通过。Actions 与公网结果在完成后补录。

## 剩余差距

仅处理 3×3 有界整数与精确分数。一般尺寸、浮点数值稳定性、奇异方程组相容性和完整解集、开放推导及真实学习者理解仍未验证。变更契约见 [OpenSpec](../../openspec/changes/university-plu-elimination-workbench/proposal.md)。
