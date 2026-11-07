## Context
原图标示熔断状态却显示无穷大电流；验电笔不亮被当作零线证明；零线和低电压被描述为必然安全；电表额定电流被当作线路的安全容量。图中插座竖向连线与其他导线交叉且与文字方向不一致。

## Decisions
短路场景仅示意保护装置已动作后的状态，负载电流为零，故障瞬时电流未计算，负载滑块禁用。正常状态的 P/U 仅用于假设的纯电阻负载；不推断真实交流负载电流或安全容量。插座仅展示位置并标注未画接线。验电笔不亮不能证明无电；实际验电由专业人员按规定进行。保护导体提供故障电流返回电源的路径，设备是否需要保护接地应按设计和规定确定。

## 依据与限制
[OSHA 电气安全资料](https://www.osha.gov/sites/default/files/2019-04/Basic_Electricity_Materials.pdf)指出潮湿等条件会降低人体电阻，低电压也可能危险；[OSHA 验电设备说明](https://www.osha.gov/sites/default/files/settlement_agreements/CWSA20130628_exhibits.pdf)指出电压指示器不能代替规定的无电确认；[OSHA 接地说明](https://obis.osha.gov/dte/library/electrical/electrical.html)描述保护导体与故障电流路径。此页面不是实际接线或验电指导，保护器动作、故障瞬态及其他安全内容未全面模拟或审核。
