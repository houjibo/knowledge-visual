## Context
原图把组件符号画在完整导线上，电压表跨接导体中部；各 input 和模式切换均直接调用会继续安排 requestAnimationFrame 的 draw，导致动画任务不断累加。

## Decisions
导线在电源、灯泡和电流表处断开；电压表支路连接导体两端，表头随长度变化保证支路不相交。导体图长随 L、线宽随横截面积平方根变化。模型使用理想 3 V 电源、5 Ω 定值灯泡和理想电表，忽略温度变化；亮度和粒子速度仅为定性示意。渲染与调度分开，仅有一个动画回调，支持暂停并在隐藏探究时停止。去掉把某电压绝对称为安全的表述。

## 依据与限制
[OpenStax 电阻率](https://openstax.org/books/college-physics-2e/pages/20-3-resistance-and-resistivity)说明电阻与长度、横截面积、材料和温度的关系；[OpenStax 电表](https://openstax.org/books/college-physics-2e/pages/21-4-dc-voltmeters-and-ammeters)说明电流表串联、电压表并联；[OSHA 电气安全资料](https://www.osha.gov/sites/default/files/2019-04/Basic_Electricity_Materials.pdf)指出潮湿等条件会改变人体电阻，低电压也可能造成伤害。实施者核对模型和绘图；实际灯丝电阻、人体风险及全页内容未作完整模拟或审核。
