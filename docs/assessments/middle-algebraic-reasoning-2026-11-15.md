# 初中数学代数推理例 66：从具体数到一般理由

核查日期：2026-11-15。依据为[义务教育数学课程标准 2025 年日常修订版扫描件](https://fxzx.qpedu.cn/jhzx/kcjs/kcbz/511597.htm)第四学段“数与式／代数式”第⑨项（印刷页 55）及例 66（印刷页 144—145，PDF 阅读器第 147—148 页）；并用[教育部 2022 年版 PDF](https://www.moe.gov.cn/srcsite/A26/s8001/202204/W020220420582346895190.pdf)核对例题文字。人教版只作教材编排示例；尚未取得该例在现行六册教材中的精确小节证据，不在页面上臆定章次。

## 局部学习证据

- [代数推理实验室](../../math/middle/algebraic-reasoning.html)让学习者自行选择四位数，先预测是否能被 3 整除，再选位值拆解 `1000a+100b+10c+d=999a+99b+9c+(a+b+c+d)` 并说明前一部分总是 3 的倍数；位值图将每位拆解成整组和余项。四位数若不可整除，页面也说明原数和各位和对 3 同余，这是例题单向结论的等价强化，数学上成立。
- 同页可选择 `a=1…9` 的末位为 5 的两位数，先算平方，再用按真实边长比例画的四块面积核对 `100a²+100a+25=100a(a+1)+25`，解释为什么是 `a(a+1)` 个整百再加 25。
- 错误预测、遗漏位值余项、少算一块或两块长条、错误因式提取有分项反馈。查看某个数的示例不计该数的独立完成；四位数可整除与不可整除、末位为 5 的平方低／高十位数四类各完成一例后才保存本机主题进度。

## 验证与边界

- `node tests/algebraic-reasoning-model.test.js`：遍历全部 9000 个四位数和 9 个末位为 5 的两位数，核对位值恒等式、各位和同余、四块面积恒等式及错误分支。
- `npx playwright test tests/browser/middle-algebraic-reasoning.spec.js --project=desktop --project=mobile`：10/10 通过，覆盖分步反馈、结构图、四类完成、示例不计、目录徽章、320px、键盘、存储失败重试和直接文件打开。
- `npm run check`：静态与 OpenSpec 严格校验通过，全量浏览器 2352 通过、6 项按既有配置跳过，开发站 387/387 页加载、发布包关键路径 22/22 与页面 387/387 加载通过。
- 功能提交 `6d9c80b` 已推送；[主分支 Actions](https://github.com/houjibo/knowledge-visual/actions/runs/43630352171)的七个作业全部成功。公开清单 revision 为 `6d9c80baa240aca52102c05da0de4fbf72c5c643` 且 `site_files_modified:false`；[公网页面](https://houjibo.github.io/knowledge-visual/math/middle/algebraic-reasoning.html) HTTP 200，页面与数学模型文件逐字节匹配提交。公网桌面／移动专项 6/6 通过，另 4 项文件直开和存储故障场景按本地专用条件跳过；[本地页面](http://127.0.0.1:4173/math/middle/algebraic-reasoning.html)与公网验收标签均保持打开。

[CE25 “数与式”逐项映射](../plans/curriculum-crosswalks/middle-math-number-expressions-ce25.json)的代数式⑨由**缺失**调整为**部分**，22 条清单相应为 0 已验证、22 部分、0 缺失。有限选择和四类完成只证明本站给出了可观察的局部任务，不证明学习者能自由书写证明、对陌生规律迁移或达到全部学业质量。下一步需要开放解释的课堂作答证据，此外初中数学其他主题的完整标准与人教版六册小节仍待核。
