# 单缸蒸汽机动力路径核查

状态：本地模型、桌面与移动专项及完整门禁通过；Actions 与公网验收待补。范围见[当前 OpenSpec 提案](../../openspec/changes/steam-engine-power-cycle/proposal.md)。

## 学习问题与依据

本场景补上从热源、气缸到工厂转轴的动力路径。[ASME 的 Boulton & Watt 旋转蒸汽机记录](https://www.asme.org/about-asme/engineering-history/landmarks/111-boulton-watt-rotative-steam-engine)说明双作用气缸与工业旋转动力的历史关系；[ASME 的 Hacienda La Esperanza 蒸汽机记录](https://www.asme.org/getmedia/464cbbcc-e6db-47c1-a469-e4e0d88f3b41/35.pdf)描述活塞往复、曲柄旋转和机器驱动。本站仅作教学示意，不复原这两台机器。

零度和 180° 是活塞换向点，左/右交替进汽按半圈切换。曲柄半径 65、连杆长 200、活塞杆示意长 240，按曲柄滑块几何求位置；转速是外部给定的教学时钟。压力、功率、热效率、阀门提前角、飞轮惯性和负载均未求解，示意图不可用于设备设计或操作。

## 验证记录

- `node tests/steam-engine-model.test.js`：端点、连杆长度、相位、周期及边界检查通过。
- `CI=true npx playwright test tests/browser/simulation-world-steam-engine.spec.js --reporter=dot`：桌面/移动共 10 项通过，覆盖分类搜索、先预测后揭晓、相位与真实 SVG 几何、转速对照、320px 键盘、减少动态、页面隐藏、两圈边界、文件直开、发布子路径和脚本缺失降级。
- `npm run check` 完整通过：静态/OpenSpec、桌面/移动功能矩阵 2202 通过/6 项既有跳过、开发站和发布包各 378 页加载、22 项发布路径。
- 本地 4173 浏览器实际完成“左侧进汽”预测和揭晓，读数 0/130、图示左侧管路高亮，辅助树说明活塞接下来向右；窄屏图示可在框内滚动，页面无整体横向溢出。
- Actions、公开版本与公网实际操作：待验收。
