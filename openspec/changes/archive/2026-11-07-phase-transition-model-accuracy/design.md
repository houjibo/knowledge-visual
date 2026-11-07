## Context
原平台压力是若干曲线值的平均值，线段端点也不对应相平衡，不能称作等面积构造。单凭体积与临界体积比较不能给出气液共存状态。

## Decisions
仅绘制未经平衡修正的范德瓦尔斯曲线，明确未计算共存压力、体积和真实相界；低于临界温度不猜测相态。超过临界温度且模型压力超过临界压力时标记超临界区，练习只判断等温线温度条件。P-T 图标明示意。

## Evidence
[NIST 相图示意](https://nvlpubs.nist.gov/nistpubs/Legacy/IR/nistir89-3933.pdf) 将超临界区域画在临界点右上方；[LibreTexts 范德瓦尔斯方程](https://chem.libretexts.org/Courses/BethuneCookman_University/BCU%3A_CH_332_Physical_Chemistry_II/Text/16%3A_The_Properties_of_Gases/16.3%3A_A_Cubic_Equation_of_State) 说明麦克斯韦等面积构造。
