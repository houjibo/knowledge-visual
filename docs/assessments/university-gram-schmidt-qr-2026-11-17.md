# 大学数学：Gram–Schmidt 与 QR 有限工作台核查

日期：2026-11-17。依据 [MIT 18.06SC 正交矩阵与 Gram–Schmidt 讲义](https://ocw.mit.edu/courses/18-06sc-linear-algebra-fall-2011/7ac32be444c25e48590f47573833ccc6_MIT18_06SCF11_Ses2.4sum.pdf)：从列向量中减去已有方向的投影，得到正交列；非零列归一化后满足 `QᵀQ=I`，并有 `A=QR`。MIT 课程是本站大学基础轨的公开参考，不是统一课标。

## 可观察学习任务

- [工作台](../../math/uni/gram-schmidt-qr.html)允许编辑 3×2 矩阵 A，元素为 −5 到 5 的整数。学习者先预测投影系数 `c`、正交余量 `u₂`、秩及第二列是否带来新方向。全对才记录完成；主动揭示只供对照，编辑会撤销旧结果。
- 精确有理数模型计算 `c=(a₁·a₂)/(a₁·a₁)`、`p=c a₁`、`u₂=a₂−p`。若 `a₁=0`，约定 `c=0`，直接从第二列寻找方向。仅归一化非零的 `a₁` 与 `u₂`，用分子向量及平方范数的根号表示 Q，用相同根号表达 R。满列秩时 R 为 2×2 上三角；秩亏时给出 `Q` 为 `3×r`、`R` 为 `r×2` 的秩揭示薄分解。
- 面板逐项展示 `a₁·u₂=0`、`QᵀQ=Iᵣ`、`R=QᵀA` 和精确 `QR=A`。正交截面图用 `‖p‖` 与 `‖u₂‖` 的相对长度画出 `a₂=p+u₂`；它不是 R³ 的固定坐标投影，零向量不画方向箭头。

## 当前验证

- `node tests/gram-schmidt-model.test.js`：1,235 个独立矩阵案例（729 个三元穷举、500 个确定性随机、6 个边界），以独立有理数投影、子式秩、数值正交性及 `QR` 重构交叉核对。
- `npx playwright test tests/browser/university-gram-schmidt-qr.spec.js --project=desktop --project=mobile`：8/8 通过，涵盖满秩、相关列、首列零、次列零、零矩阵、分数投影、完成条件、无效输入及分数原始边界、目录、320px、键盘 Enter、文件直开和发布子路径。
- `CI=1 npm run check` 全部通过：全量交互 2,638 项、开发站与发布包各 404 页加载，新增工作台的桌面发布关键流程 4/4 通过。
- 功能提交 `20bba4094264d9344b219177ef84cb24b6cb5436` 的 [GitHub Actions run 44046982704](https://github.com/houjibo/knowledge-visual/actions/runs/44046982704) 完成且成功。公网 `release-version.json` 的 revision 匹配该 SHA，`site_files_modified:false`。公网专项首次 5/6 通过、2 项本地路径检查按配置跳过；移动端一项在导航时遇到连接重置，单项重跑 1/1 通过，合计六项均有通过证据。

## 剩余差距

本工作台只处理 3×2 有界整数输入，分数预测有原始分子、分母上限。它不覆盖一般尺寸、一般实数或数值稳定的浮点 QR，也不代替开放证明、真实学习者理解测试与完整屏幕阅读器验收。后续核正定性、SVD 及线性代数其他项目；变更契约见 [OpenSpec](../../openspec/changes/archive/2026-11-17-university-gram-schmidt-qr/proposal.md)。
