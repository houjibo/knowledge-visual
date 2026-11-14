# 初中有理数乘方意义：有限案例核查

日期：2026-11-13。课程依据为[义务教育数学课程标准 2025 年日常修订版](https://fxzx.qpedu.cn/wcm.files/upload/CMSfxzx/202603/202603180320047.pdf)第四学段“数与式／有理数”第三条（印刷页 54）；[2022→2025 逐条复核](middle-ce25-content-recheck-2026-11-13.md)已确认该条学习要求未变。变更契约见[归档 OpenSpec](../../openspec/changes/archive/2026-11-13-middle-rational-powers-explorer/proposal.md)。

## 已实现与边界

- [有理数页](../../math/middle/rational-numbers.html)增加独立乘方探索：先判断指数对应的相同因数个数，再预测乘积；错答可重试，正确后展开因数。主动查看展开明确标作示例，不算独立预测。
- 七个有限案例涵盖正整数、负整数偶次和奇次、括号外负号、正负分数与零。其中 `(−2)² = 4` 展开为两个 `−2` 相乘，`−2² = −4` 展开为 `−(2 × 2)`；结果由精确整数分数模型生成。
- 使用原生选择框、按钮和文字反馈，保持 320px、键盘按钮和 `file://` 静态打开可用；原四则计算器与既有完成记录不改。有限案例尚不能证明自由构造、迁移解释或真实学习者理解。

## 验证记录

- `node tests/rational-power-model.test.js`：七例结果、因数个数、唯一正确选项、负号范围和非法案例检查通过。
- `npx playwright test tests/browser/middle-rational-powers-explorer.spec.js --project=desktop --project=mobile`：6/6，通过分数两步预测、括号负号对照、切换清理、主动展开、零、320px、键盘按钮及直接文件打开。
- 完整 `npm run check` 通过：静态、课程映射及严格 OpenSpec 校验；功能浏览器 2,230 项通过、6 项按配置跳过，开发站与发布包各 379 页加载，发布包关键流程 22 项通过。桌面与 320px 页面已截图目视检查；本地实时验收标签已打开并实际完成 `−2²` 的两步预测。
- 提交 `45a6292` 已推送，主分支 [Actions #316](https://github.com/houjibo/knowledge-visual/actions/runs/43438793735) 的 core、桌面、移动、汇总、构建、部署和部署后核验七项均成功；公开 `release-version.json` 指向 `45a6292fcff691746fb2a48a12096f3fb34b3cb8`。
- 公网专项：`KV_PUBLISHED_BASE_URL=https://houjibo.github.io/knowledge-visual/ npx playwright test tests/browser/middle-rational-powers-explorer.spec.js --project=desktop --project=mobile --workers=2`，6/6 通过。还在真实公网浏览器手动选择 `(−2)²`、依次预测 `2 次` 与 `4`，观察到 `−2 × −2 = 4`；本地和公网页面均已打开供验收。

本次乘方更新后，CE25 有理数五条内容要求当时为 0 已验证、4 部分、1 缺失；第三条从缺失升为部分。第四条仍为部分，三步内混合运算和运算律未补；第五条情境列式当时仍缺，后续[补充核查](middle-rational-context-problems-2026-11-14.md)已使其成为部分。现行状态见[CE25 内容映射](../plans/curriculum-crosswalks/middle-math-rational-numbers-ce25.json)。完整学段分母、学业要求和学业质量仍待建立，不能据这五条计算全站覆盖率。
