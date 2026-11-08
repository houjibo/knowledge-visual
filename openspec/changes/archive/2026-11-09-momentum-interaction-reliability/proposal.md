## Why

动量页的隐藏画布在首次切换时保持默认尺寸，模拟运行中也能修改参数，重置后旧计时器仍可能继续更新；碰撞图的有符号动量柱方向相反，重复点击同一道题会重复增加完成数。这些问题会让可视化结论与输入不一致，也阻断键盘用户的学习路径。

## What Changes

- 将四个学习主题改为可键盘操作的语义化标签页；切换和缩放后绘制正确尺寸的活动画布。
- 为冲量演示提供明确可调的作用时长，锁定运行期间使用的参数，并让重置立即取消旧动画。
- 修正碰撞动量柱的正负方向；碰撞及反冲动画运行期间锁定参数，重置可靠停止已有动画。
- 将练习选项改为键盘可操作按钮，每题只接受一次答案，并按三道不同题的正确答案点亮进度。
- 增加桌面和窄屏专项浏览器回归，并更新交互覆盖、风险索引及页面控件清单。
- 将现有浏览器计时测试固定在确定的起始时间，避免墙钟读取竞态导致整套回归偶发失败。

## Capabilities

### New Capabilities
- `momentum-learning-reliability`: 动量主题导航、画布、物理模拟和练习进度的可观察行为契约。

### Modified Capabilities

## Impact

- 页面：`physics/high/momentum.html`
- 测试与证据：`tests/browser/`、`package.json`、`docs/assessments/interaction-evidence.json`、交互覆盖与风险索引、`page-inventory.json`
- 变更管理：新增 OpenSpec 规格并在发布验证后归档。
