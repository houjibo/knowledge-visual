## Why

高中物理“曲线运动”页把五张画布分布在三个标签中，但初始化会同时绘制隐藏标签，首次进入“抛体运动”时画布尺寸为零；测验按八题循环，却用累计答对次数点亮知识地图，重复同一道题五次即可达标。这两处问题削弱了运动模型的可观察性和学习进度可信度，本地交互已复现画布空白，源码路径确认存在重复计数。

## What Changes

- 首次显示、切换标签和调整视口时只绘制活动主题中的画布；保留隐藏期间运行的动画返回后可恢复所需的画布逻辑高度。
- 保留答题得分，同时把知识地图门槛改为答对五道不同题目，并单独显示不同题目进度。
- 添加桌面与窄屏浏览器回归，覆盖五张画布、隐藏动画往返、滑块状态和重复题完成门槛；更新交互证据索引与项目差距。

## Capabilities

### New Capabilities
- `curve-motion-learning-reliability`: 保障曲线运动页面画布的可见性、切换恢复和练习完成反馈。

### Modified Capabilities

## Impact

影响 `physics/high/curve-motion.html`、对应 Playwright 浏览器回归、`package.json`、`docs/assessments/interaction-evidence.json`、生成的交互覆盖索引及 `docs/gaps.md`。不新增依赖、不改变运动方程或全站进度存储接口。
