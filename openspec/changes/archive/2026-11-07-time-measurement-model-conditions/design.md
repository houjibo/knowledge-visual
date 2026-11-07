## Context
正午影子方向取决于纬度和季节；单摆小幅近似周期取决于长度与重力加速度。水钟示意的模拟时间与实际播放速度不同。

## Decisions
日晷限定北京附近的太阳时并声明非实测，调整刻度与影子方向相符；单摆将档位映射到米并按 2π√(L/g) 计算，采用 0.2 弧度示意摆幅和近似地球重力。水钟假设恒流且标示模拟时间，满后停止并可重置。动画遵从减少动态效果并允许逐步操作。

## Evidence
[NOAA 太阳时与正午影子](https://gmd-int.cmdl.noaa.gov/grad/solcalc/glossary.html) 说明正午影子可能指向南或北；[OpenStax 单摆](https://openstax.org/books/college-physics-2e/pages/16-4-the-simple-pendulum) 给出小摆幅近似公式及适用条件。
