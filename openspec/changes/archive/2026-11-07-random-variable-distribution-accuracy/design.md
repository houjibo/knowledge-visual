## Context
正态模型原 x、y 轴都随 σ 缩放，固定像素上曲线形状不变；超几何模式只在计算时截断 n，滑块本身仍允许 30，且离散分布图把期望附近的柱错误称为峰值。

## Decisions
正态图固定 x 为 −12 至 12，纵轴以 σ=0.5 的最大密度定标，覆盖滑块范围；阴影仍为 ±σ。超几何模式将 n 限制到总体数 20，切回二项分布恢复上限 30。离散柱高按当前峰值缩放并明确说明，绿色表示最接近期望的整数而非峰值。练习第 3 题改为 C(3,1)C(7,1)/C(10,2)=21/45，三位小数题按舍入精度核对。

## 数学依据
[OpenStax 正态分布图](https://openstax.org/books/principles-data-science/pages/9-3-graphing-probability-distributions)描述标准差与曲线宽高的关系及密度公式；[OpenStax 超几何分布](https://openstax.org/books/introductory-business-statistics/pages/4-1-hypergeometric-distribution)给出不放回抽样的组合公式。由实施者核对页面公式与样例，未全面审核其他内容。

## Limits
固定图窗仅显示 −12 至 12，离散图为相对柱高；测试覆盖边界与实际画布路径，不代表全部题目及无障碍已验收。
