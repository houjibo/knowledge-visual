## Context
原半径 50 和流速 2 的预填流量是 15.7 L/s，对应 50 mm，而旧计算按 50 cm 得出 1570 L/s。两滑杆互不约束，因此出口可能比入口更宽；原液柱高度方向与负压差不一致且无物理尺度。

## Decisions
统一采用毫米输入，面积转换为平方米，再按 Q=A₁v₁ 换算 L/s。明确水平均高、定常、不可压缩和无黏性假设，不推断绝对压强或空化；保留压差数值，移除没有合理标度的液柱。机翼题以压力分布求力为题意，不将向下偏转与压力作用当作互斥机制。

## Evidence
[USGS 连续性原理](https://pubs.usgs.gov/of/2001/0050/report.pdf) 给出 Q=Av 和不可压缩定常流条件；[NASA 流线与压力](https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/definition-of-streamlines/) 说明沿流线使用伯努利关系及机翼表面受力。
