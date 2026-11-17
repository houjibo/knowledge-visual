# 大学数学：非正交基坐标与相似变换有限工作台核查

日期：2026-11-17。依据：[MIT 18.06SC《Change of basis; image compression》讲义](https://ocw.mit.edu/courses/18-06sc-linear-algebra-fall-2011/7ce6815ffe9ec37129e581485494acde_MIT18_06SCF11_Ses3.7sum.pdf)。讲义区分向量坐标 `x=Wc` 与同一线性变换的矩阵表示 `B=W⁻¹AW`。本站此前的[Haar 实验](../../math/uni/haar-basis-compression.html)只处理正交基，未让学习者处理一般可逆矩阵或相关列的边界。

## 有限模型与学习任务

新增[非正交基工作台](../../math/uni/change-of-basis.html)：编辑有界 2×2 整数基矩阵 W、标准变换矩阵 A 和向量 x，先预测 det(W)、是否为基、x 的新基坐标及 B₁₁。有效基时，以伴随矩阵和精确有理数计算 `c=W⁻¹x`、`B=W⁻¹AW`，核验 `Wc=x`、`AW=WB`、`W(Bc)=Ax` 及相似矩阵的迹、行列式不变。画布仅按比例展示标准平面中的 w₁、w₂、x 与 Ax。

det(W)=0 时不计算 W⁻¹、c 或 B。工作台区分 W 为零矩阵、x 在列空间但坐标不唯一、x 不在列空间而无法表示。正确识别非基可查看解释，只有在有效基下完成坐标和矩阵元预测才记录进度。输入 W、A 限 −3..3 整数，x 限 −4..4 整数；一般维数和病态浮点计算不在此模型内。

## 验证记录

- `node tests/basis-change-model.test.js`：9604 个精确矩阵案例，核对行列式、Cramer 坐标、`AW=WB`、向量乘回、相似不变量及相关列边界。
- 桌面／移动浏览器专项 8/8 通过，覆盖错误修正、主动揭示、分数、负行列式、相关列内外、零矩阵、无效输入、320px、键盘、目录、文件直开和发布包子路径。
- 完整 `CI=1 npm run check` 通过：2678 项浏览器功能回归通过、8 项按配置跳过；开发站与发布包各 409 页加载通过，发布包功能专项通过。Chromium 实际截图检查 1100px 与 320px 的编辑、反馈、公式和图示排版，两种宽度均无横向溢出。提交 `690bb48b26c91e28b56e0ed13fd3b55dad41da8e` 的 [Actions run 44118917296](https://github.com/houjibo/knowledge-visual/actions/runs/44118917296) 成功。公网 `release-version.json` 的 revision 匹配该提交且 `site_files_modified:false`；新页面和两个脚本均返回 200，公网桌面／移动专项 6 项通过、2 项本地专用场景按配置跳过。

## 剩余差距

一般维数基变换、学习者自构证明、数值病态基的稳定算法、真实图像编码及真实学习者理解仍需另核。本站 2×2 模型不能代表这些目标已覆盖。
