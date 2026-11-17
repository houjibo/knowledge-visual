# 大学数学：PLU 工作台的奇异方程完整解核查

日期：2026-11-18。依据 [MIT 18.06SC《Solving Ax=b: row reduced form R》](https://ocw.mit.edu/courses/18-06sc-linear-algebra-fall-2011/f5a74578196a8afc2fd2ba8581acb17f_MIT18_06SCF11_Ses1.8sum.pdf)：先判断相容，再把自由变量设零求特解，所有解由特解加零空间向量给出。本站 [PLU 原核查](university-plu-elimination-workbench-2026-11-18.md)只断言奇异时没有唯一解，不能区分当前 b 导致无解还是无穷多解。

## 增量学习任务

- [PLU 工作台](../../math/uni/plu-elimination.html)保留可编辑 A 和 b、行交换、精确 `PA=LU`。现在对每个输入先前代 `Ly=Pb`，再精确化简 `[U|y]`，核对它与 `[A|b]` 的增广秩。预测项增加增广秩及“唯一／无穷多／无解”三种分类；只改 b 会清除旧结论。
- 若增广秩大于系数秩，展示 `[0,0,0|1]` 对应 `0=1` 的矛盾行，不给出虚假特解。若两秩相等，以自由变量全零构造 xₚ，对每个自由列构造一个特殊零空间向量 nⱼ，展示 `x=xₚ+Σtⱼnⱼ`，并从原始 A 精确核验 `Axₚ=b` 与 `Anⱼ=0`。
- 加入相同奇异 A 的相容／不相容右端、秩 1 的两个自由变量、秩 0 的零与非零右端案例。原有完成条件不变：主动揭示或仅做奇异例子不记完成，可逆例子的完整预测全对才记完成。

## 验证记录

- `node tests/plu-model.test.js`：8412 个矩阵案例，独立子式计算系数与增广秩，交叉核对分类、特解、零空间方向及原有 Cramer 解；包括 2400 个有意构造的秩亏输入。
- PLU 浏览器专项桌面／移动 8/8 通过，检查同一 A 更换 b 后从完整解切到矛盾行、增广秩错误反馈、秩 1/0、无进度、键盘、320px、文件直开与发布包子路径。Chromium 实际截图核对 1100px 的秩 1 参数解和 320px 的秩 1、无解分支；两种宽度均无横向溢出，公式卡片可读。
- 完整 `CI=1 npm run check` 通过：2686 项浏览器功能回归通过、8 项按配置跳过；开发站与发布包各 410 页加载通过，发布包功能专项通过。提交 `fccacc5991e3b0dcee120eb3472fc3c5b9208993` 的 [Actions run 44143510348](https://github.com/houjibo/knowledge-visual/actions/runs/44143510348) 成功。公网 `release-version.json` 的 revision 匹配且 `site_files_modified:false`；页面与两个脚本均返回 200，公网桌面／移动专项 6 项通过、2 项本地专用场景按配置跳过。

## 剩余差距

此模型仅处理三阶有界整数输入。一般矩形与高维系统、浮点数值稳定性、开放推导和真实学习者理解仍未验证；局部案例不代表 MIT 18.06 的完整解目标全面达成。变更契约见 [OpenSpec](../../openspec/changes/archive/2026-11-18-university-singular-system-complete-solutions/proposal.md)。
