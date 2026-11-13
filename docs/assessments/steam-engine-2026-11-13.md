# 单缸蒸汽机动力路径核查

状态：本地模型、桌面与移动专项、完整门禁、Actions 七项与公网实际操作通过；变更已归档。范围见[归档 OpenSpec](../../openspec/changes/archive/2026-11-13-steam-engine-power-cycle/proposal.md)。

## 学习问题与依据

本场景补上从热源、气缸到工厂转轴的动力路径。[ASME 的 Boulton & Watt 旋转蒸汽机记录](https://www.asme.org/about-asme/engineering-history/landmarks/111-boulton-watt-rotative-steam-engine)说明双作用气缸与工业旋转动力的历史关系；[ASME 的 Hacienda La Esperanza 蒸汽机记录](https://www.asme.org/getmedia/464cbbcc-e6db-47c1-a469-e4e0d88f3b41/35.pdf)描述活塞往复、曲柄旋转和机器驱动。本站仅作教学示意，不复原这两台机器。

零度和 180° 是活塞换向点，左/右交替进汽按半圈切换。曲柄半径 65、连杆长 200、活塞杆示意长 240，按曲柄滑块几何求位置；转速是外部给定的教学时钟。压力、功率、热效率、阀门提前角、飞轮惯性和负载均未求解，示意图不可用于设备设计或操作。

## 验证记录

- `node tests/steam-engine-model.test.js`：端点、连杆长度、相位、周期及边界检查通过。
- `CI=true npx playwright test tests/browser/simulation-world-steam-engine.spec.js --reporter=dot`：桌面/移动共 10 项通过，覆盖分类搜索、先预测后揭晓、相位与真实 SVG 几何、转速对照、320px 键盘、减少动态、页面隐藏、两圈边界、文件直开、发布子路径和脚本缺失降级。
- `npm run check` 完整通过：静态/OpenSpec、桌面/移动功能矩阵 2202 通过/6 项既有跳过、开发站和发布包各 378 页加载、22 项发布路径。
- 本地 4173 浏览器实际完成“左侧进汽”预测和揭晓，读数 0/130、图示左侧管路高亮，辅助树说明活塞接下来向右；窄屏图示可在框内滚动，页面无整体横向溢出。
- [Actions #43339735691](https://github.com/houjibo/knowledge-visual/actions/runs/43339735691) 的 core、桌面、移动、汇总、构建、部署和部署后校验七项成功；公网 `release-version.json` 匹配提交 `69dcea01b5fc081849f4fe99b9912781d5559ec5` 且 `site_files_modified:false`。前一功能提交 `79e40eb` 的检查和构建通过，但因后续文档提交成为新主分支头，发布守卫跳过了旧提交部署；最终发布以 `69dcea0` 为准。
- `KV_PUBLISHED_BASE_URL=https://houjibo.github.io/knowledge-visual/ GITHUB_SHA=69dcea0…` 的公网蒸汽机专项浏览器测试 1 项通过。公开浏览器实际操作“预测左侧进汽→揭晓→前进四次 45°”后，图示和辅助说明切到 180° 右侧进汽，活塞行程 130/130、演示时间 2.00 s；本地与公网验收标签页已打开。真实设备、全页屏幕阅读器和学习者理解未测。
