# 大学随机过程：二维布朗运动模拟核查

核查日期：2026-11-17。大学随机过程是本站大学数学拓展主题，不纳入微积分和线性代数基础轨覆盖分母；本次不代表完整随机过程课程审计。标准布朗运动增量和路径性质参考 MIT OCW 的[随机过程讲义](https://ocw.mit.edu/courses/15-070j-advanced-stochastic-processes-fall-2013/ead1ddea0e6f0454a87c0d88e2553fee_MIT15_070JF13_Lec8.pdf)；二维独立正态向量的半径具有 [Rayleigh 分布](https://itl.nist.gov/div898/software/dataplot/refman2/auxillar/raypdf.htm)，其均值公式见 [MIT OCW 推导](https://ocw.mit.edu/ans7870/18/18.443/s15/projects/Rproject3_rmd_rayleigh_theory.html)。

## 发现与修正

[随机过程页](../../math/uni/stochastic-process.html)每步对两个坐标分别增加独立正态增量 `σ√Δt Z`，但原本把二维径向距离均值与一维标准布朗运动的 `√(2t/π)` 比较，既错用维数又忽略尺度；改变 σ 时也未重置，导致混合不同尺度的轨迹。现固定参数运行，给定 `t` 时坐标均服从 `N(0,σ²t)`，径向距离均值的理论值为 `σ√(πt/2)`。显示的平均与最大值分别是有限粒子在当前时刻距原点的样本均值及最大值，有限样本会波动。改变 σ 或粒子数停止并重置，明确通知；时间显示两位小数，避免 `Δt=0.05` 被过度舍入。

页面区分一维标准布朗运动与二维离散模拟，说明连续路径几乎必然连续且处处不可微，而连接离散点的图形不能证明这一性质。正态采样改为零随机值也能结束的 Box–Muller 形式；同时修复 320px 布朗运动布局的横向溢出。

## 验证与边界

桌面和移动专项共 12 项通过，包含实际矩阵与旧马尔可夫回归、受控正态增量、两种尺度、多个时间步、暂停/参数重置、随机数为零、320px、键盘、文件直开和发布构建子路径。完整 `npm run check` 通过：全站功能套件 2580 项通过、8 项按条件跳过，401 页加载及发布构建专项 3 项通过；[远端工作流](https://github.com/houjibo/knowledge-visual/actions/runs/43963663910)成功；公网 revision 为 `9b59ee44c31e3c51d9c36d39b5352be3b412b076`，桌面和移动专项 4 项通过，2 项本地专用路径检查按条件跳过。二维轨迹只在有限采样时刻与理论分布一致，不是连续路径的精确显示；泊松过程与其他题库内容尚待独立核查，真实设备和屏幕阅读器也未全面核查。变更契约见[OpenSpec](../../openspec/changes/archive/2026-11-17-university-brownian-distance-correctness/proposal.md)。
