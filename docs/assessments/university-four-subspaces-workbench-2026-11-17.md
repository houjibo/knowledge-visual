# 大学数学：四个基本子空间有限工作台核查

日期：2026-11-17。对照 [MIT 18.06 课程大纲](https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/pages/syllabus/) 的基、维数与四空间目标，以及 [MIT 18.06SC 四空间讲义](https://ocw.mit.edu/courses/18-06sc-linear-algebra-fall-2011/62a9db9eeab190694d40afe4734068ca_MIT18_06SCF11_Ses1.10sum.pdf) 和 [正交子空间讲义](https://ocw.mit.edu/courses/18-06sc-linear-algebra-fall-2011/fdce42d9c8d8dc4eac7a9db3c1978e18_MIT18_06SCF11_Ses2.1sum.pdf)。这些是本站大学基础轨的公开参考，不是大学统一课标。

## 交付范围

- [四个基本子空间工作台](../../math/uni/four-subspaces.html)允许编辑 2–3 行、2–3 列，元素为 −5 至 5 整数的矩阵；预设包含秩亏、满行秩、满列秩、零矩阵和方阵。学习者先预测秩与两侧零空间维数，再从原列、原行和自由变量构造四组基。独立的替代原列／原行基也被接受。
- 页面用输入空间 `Rⁿ` 与输出空间 `Rᵐ` 放置四空间，给出精确分数 RREF、基、`Ax=0`、`Aᵀy=0`、两对正交关系和 `r+(n−r)=n`、`r+(m−r)=m`。学习者可输入整数或分数候选向量，区分空间成员、零向量和一维空间的单向量基；多维空间不把一个非零成员称为整组基。
- 仅在秩、维数和四组基选择全部正确时记录学习完成；直接揭示不记录。编辑矩阵或输入无效会撤销旧答案，避免新矩阵配旧结果。

## 本地验证

- `node tests/four-subspaces-model.test.js`：626 个矩阵案例，含 2×2 三值全枚举、带种子的矩形与方阵及边界案例；以独立子式秩检查四个基的维数、乘积、正交、替代基和无效输入。
- `npx playwright test tests/browser/university-four-subspaces-workbench.spec.js --project=desktop --project=mobile`：8/8 通过；覆盖预测错误与纠正、揭示完成条件、分数、候选向量、零／满秩、矩形、无效编辑恢复、目录、320px、键盘 Enter、文件直开和构建子路径。
- `npm run check:static` 通过；全量浏览器首轮 2564 通过、8 跳过、58 项在测试环境长时间停顿中超时，随后用 2 个 worker 单独重跑失败项 58/58 通过。全站开发页加载 402/402，发布包逐页加载 402/402，`npm run test:release` 全部通过。远端 CI 与公网版本核对在发布后补记。此页的模型范围、有限用例与课程目标不能推成任意实数矩阵求解能力，也不能代替真实学习者或完整屏幕阅读器验收。

## 后续差距

MIT 18.06 的 `Ax=b` 完整通解、列空间成员判定、投影与最小二乘、Gram–Schmidt／QR、正定性、SVD 与应用仍需分别设计和验证。下一小步优先投影与最小二乘：检查残差正交及满列秩、相关列情形，和现有高中回归素材明确区分。
