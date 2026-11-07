## Context
原状态将 209 至 231 V 视为额定，实际功率条以额定功率的 150% 为满刻度却未标注。灯具亮度不仅取决于输入瓦数，真实灯丝电阻也随温度变化。

## Decisions
只在 220 V 标为额定，高低电压使用对应说明，不预测具体损坏时刻。采用已有 484 Ω 固定电阻理想模型，明确只用于同一灯泡的定性示意；不同灯具亮度需考虑发光效率。功率条及无障碍值使用 0～150% 范围，修复高电压光晕渐变末端。计算题收紧精确答案判定，并拒绝数值后的无效字符。

## 依据与限制
[OpenStax 电阻与温度](https://openstax.org/books/college-physics-2e/pages/20-3-resistance-and-resistivity)说明电阻率受温度影响；[美国能源部灯具说明](https://www.energy.gov/cmei/femp/purchasing-energy-efficient-light-bulbs)说明不同灯具达到相同光输出所需功率不同。模型不模拟温度、光谱、寿命或电气安全；其他题目与无障碍未全面审核。
