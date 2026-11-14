# 初中实数对称与距离实验室核查

核查日期：2026-11-15。[现行义务教育数学课程标准 2025 年日常修订版](https://fxzx.qpedu.cn/wcm.files/upload/CMSfxzx/202603/202603180320047.pdf)第四学段“数与式／实数”③，印刷页 54，要求借助数轴理解并求实数的相反数、绝对值；[教育部 2022 年版原文](https://www.moe.gov.cn/srcsite/A26/s8001/202204/W020220510531636118932.pdf)同项用于版本对照。[人教社现行七下交互资源](https://www.pep.com.cn/xw/zt/xkzt/csazy/csa7x/)将数轴上表示 π 放在“8.3 实数及其简单运算”；人教版章次仅是选定示例，不是课标覆盖分母。

## 交付与可观察学习

- [实数对称与距离实验室](../../math/middle/real-symmetry-distance.html)提供 `√2`、`−√2`、`π`、`−π`、`e`、`−e`、`3/2`、`−3/2`、`0`、`√0` 十个有限案例。学习者先在 −4 至 4 数轴上估计原数，再在零的另一侧放相反数，最后分别判断相反数、绝对值和距离理由。
- 无理数点按十分位近似定位，允许 0.1 的误差；有理数与零必须放在精确刻度。完成后才显示实际位置和两段等长距离，`≈` 仅用于无理数小数，`|−π|=π` 等符号关系保持精确。
- 正无理数、负无理数、非零有理数、零四类各独立完成一次才保存本机进度。查看示例的案例不计入；零另有 `√0` 可继续练习。页面进入初中目录和首页检索。

## 验证与剩余边界

- `node tests/real-symmetry-model.test.js`：10 案例数值与符号、近似与精确定位、零、非法输入、距离输出均通过。
- `CI=true npx playwright test tests/browser/middle-real-symmetry-distance.spec.js --project=desktop --project=mobile --reporter=line`：14/14 通过。涵盖错误修正、负 π、零示例不计、四类进度、目录/搜索、320px 键盘和切题、文件直开及存储失败重试。
- 桌面与 320px 全页画面已检查；为使手机拖动滑块时仍能观察数轴，窄屏将数轴置于控件前并在作答时保持可见。无横向溢出。
- `npm run check` 完整通过：功能浏览器测试 2390 通过、6 跳过，开发态全页面 390 通过，发布包交互 22 通过，发布包全页面 390 通过；静态与纯模型检查也通过。
- 功能提交 `5497a7f` 的 [Actions 七项任务](https://github.com/houjibo/knowledge-visual/actions/runs/43646352759)全部成功；公网 `release-version.json` 对应完整提交且 `site_files_modified=false`。公网桌面/移动专项 10 通过、4 项按本机文件与存储条件跳过；页面、模型、共用实数模型、初中目录、检索目录和首页共六个资源与提交逐字节相同。
- `±3/2`、`0` 与 `√0` 同时为[CE25 有理数②逐项映射](../plans/curriculum-crosswalks/middle-math-rational-numbers-ce25.json)提供有限证据；它与[实数③逐项映射](../plans/curriculum-crosswalks/middle-math-number-expressions-ce25.json)均继续标为“部分”。这些样例不代表任意实数自由输入、所有表达式等价变换、开放论证、真实学习者迁移或整页辅助技术验收。
- 本次需求、设计和任务见[已归档 OpenSpec 变更](../../openspec/changes/archive/2026-11-15-middle-real-symmetry-distance/proposal.md)，当前契约见[主规格](../../openspec/specs/middle-real-symmetry-distance/spec.md)。
