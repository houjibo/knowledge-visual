## Context
已有示例展示固定数轴，但缺少自主更改点位的操作和同步反馈。

## Goals / Non-Goals
学习者能选择 0 至 10 的整数，并观察点位及文字变化；保留已有示例与练习，不扩展负数或分数。

## Decisions
原生范围控件提供触摸和键盘操作；复用数轴绘制函数，文字描述提供非颜色反馈。0 单独说明为原点。

## 教学依据
对照 [OpenStax Prealgebra：Introduction to Whole Numbers](https://openstax.org/books/prealgebra/pages/1-1-introduction-to-whole-numbers)：0 是原点，整数点等距，数字从左至右增大。由本次变更实施者将这些关系与 SVG 刻度和文本逐项核对；不代表完整教材或无障碍审核。

## Risks / Trade-offs
滑块限定 0 至 10，避免暗示该局部图示覆盖完整数轴；测试桌面和模拟窄屏，真实设备仍需验证。
