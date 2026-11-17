# 大学数学：正定性与二次型有限工作台核查

日期：2026-11-17。依据 [MIT 18.06SC《Positive Definite Matrices and Minima》](https://ocw.mit.edu/courses/18-06sc-linear-algebra-fall-2011/d163e012754258d3b374548504d8a18a_MIT18_06SCF11_Ses3.3sum.pdf) 的对称 2×2 首个顺序主子式、行列式、特征值与二次型判据，以及 [《Symmetric Matrices and Positive Definiteness》](https://ocw.mit.edu/courses/18-06sc-linear-algebra-fall-2011/804ab1e53134741d2044d241b50a285e_MIT18_06SCF11_Ses3.1sum.pdf) 对实对称矩阵和正定性的说明。MIT 课程是本站大学基础轨的公开参考，不是统一大学课标。

## 可观察学习任务

- [正定性与二次型工作台](../../math/uni/positive-definite.html)允许编辑 2×2 矩阵 A，各项为 −5 到 5 的整数，测试向量各项为 −3 到 3 的整数。学习者先预测 A 是否对称、二次型的六种符号类别及当前向量处的值；全对才记录完成，主动揭示不记录。
- 精确模型计算 `q(x,y)=xᵀAx=a x²+(b+c)xy+d y²`、`S=(A+Aᵀ)/2` 和 `4det(S)=4ad−(b+c)²`，以该整数判别值、迹和对角元区分严格正定、非零正半定、严格负定、非零负半定、不定与零型。对称 A 另显示 `a>0`、`det(A)>0` 的 2×2 正定判据；非对称时明确区分二次型严格正与 A 是“对称正定矩阵”。
- 非正定情形展示非零负方向或非零零方向及精确 q 值；不定情形同时展示正、负方向。符号区域图显示有限实数网格、当前向量及半定零方向，文字明确图上取样不能替代全称证明。零向量可以用于代值，但不会用作严格正定的证据。

## 当前验证

- `node tests/positive-definite-model.test.js`：14,649 个矩阵案例，包括全部 14,641 个有界整数矩阵和 8 个针对性边界；以独立特征值数值符号与矩阵乘法核对六类、对称性、二次型值、证据向量与输入边界。
- `npx playwright test tests/browser/university-positive-definite-quadratic-forms.spec.js --project=desktop --project=mobile`：8/8 通过，覆盖六类符号、非对称反例、行列式正但负定、预测与揭示、无效输入、零测试向量、目录、320px、键盘 Enter、文件直开和发布子路径。桌面与 320px 页面截图人工核对无横向溢出。
- `CI=1 npm run check` 全部通过：全量交互 2,646 项、开发站与发布包各 405 页加载，新增页面桌面发布关键流程 4/4 通过。远端 Actions 和公网部署验证待本轮完成后补记。

## 剩余差距

本工作台只处理 2×2 有界整数矩阵，区域图为有限网格；模型判别才支持对所有实向量的符号结论。它未提供一般维度的正定性算法、正交特征向量构造、谱定理的交互证明、真实应用、学习者理解实验或完整屏幕阅读器验收。后续据 [MIT 18.06 十项目标对照](university-linear-algebra-mit-18-06-2026-11-17.md)继续补该项目的谱定理与 SVD 等差距。变更契约见 [OpenSpec](../../openspec/changes/university-positive-definite-quadratic-forms/proposal.md)。
