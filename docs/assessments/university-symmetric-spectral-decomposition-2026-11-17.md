# 大学数学：实对称矩阵谱分解有限工作台核查

日期：2026-11-17。依据 [MIT 18.06SC《Symmetric Matrices and Positive Definiteness》](https://ocw.mit.edu/courses/18-06sc-linear-algebra-fall-2011/804ab1e53134741d2044d241b50a285e_MIT18_06SCF11_Ses3.1sum.pdf)：实对称矩阵可取一组正交归一特征向量，写成 `A=QΛQᵀ`；各 `qᵢqᵢᵀ` 是对应特征方向上的投影。MIT 课程是本站大学基础轨的一条参考，不是统一大学课标。

## 可观察学习任务

- [谱分解工作台](../../math/uni/symmetric-spectral.html)允许编辑 2×2 对称矩阵的三个独立元素（−5 到 5 整数）和二维测试向量（−3 到 3 整数）。学习者预测迹、特征值是否重复、当前非零向量是否为特征向量及 `Av`；全部正确才记录完成，主动揭示不记录。左下角元素与右上角联动，避免输入破坏对称条件。
- 精确模型令 `T=tr(A)`、`Δ=(a−d)²+4b²`、`B=2A−TI`。当 `Δ>0`，给出 `λ±=(T±√Δ)/2`、正交特征方向及 `P±=(I±B/√Δ)/2`；以有理数与根号系数精确核验 `B²=ΔI`、`P₊+P₋=I`、`P₊P₋=0`、`P±=q±q±ᵀ`、`A=λ₊P₊+λ₋P₋=QΛQᵀ`、`v=P₊v+P₋v` 和 `Av=λ₊P₊v+λ₋P₋v`。图只把精确结果数值化以画特征轴和向量投影。
- 标量重根时选标准正交基 `Q=I`，明确它不是唯一选择，任何非零向量都是特征向量；零向量不是特征向量，也不画零长度箭头。

## 当前验证

- `node tests/symmetric-spectral-model.test.js`：6,655 个矩阵与向量案例，遍历全部 1,331 个允许的对称矩阵及五种测试向量；模型先做精确代数核验，测试再用独立数值特征值、正交性、矩阵与向量乘回交叉核对。
- `npx playwright test tests/browser/university-symmetric-spectral-decomposition.spec.js --project=desktop --project=mobile`：8/8 通过，覆盖有理/无理特征值、对角、异号、标量重根、零矩阵、零向量、预测与揭示、无效输入、对称联动、目录、320px、键盘 Enter、文件直开及发布子路径。桌面与 320px 截图人工核对无横向溢出。
- `CI=1 npm run check` 全部通过：全量交互 2,654 项、开发站与发布包各 406 页加载，新增页面桌面发布关键流程 4/4 通过。远端 Actions 和公网部署验证待本轮完成后补记。

## 剩余差距

模型仅处理 2×2 有界整数实对称矩阵和有界整数向量，不覆盖一般维度、非对称矩阵或浮点数值稳定性。没有开放证明、真实学习者对重根基不唯一的理解测试、完整屏幕阅读器验收；SVD、一般基变换和应用继续按 [MIT 18.06 十项目标对照](university-linear-algebra-mit-18-06-2026-11-17.md)推进。变更契约见 [OpenSpec](../../openspec/changes/university-symmetric-spectral-decomposition/proposal.md)。
