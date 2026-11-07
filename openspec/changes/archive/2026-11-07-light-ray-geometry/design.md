## Context
原代码从鼠标坐标直接计算极角，入射线可能从镜面另一侧开始；折射鼠标落到水下时也可能形成无意义的钝角。

## Goals / Non-Goals
让反射光线位于同一侧并关于法线对称；空气到水遵循斯涅尔定律；支持键盘、触摸与鼠标控制，包含零度和边界。

## Decisions
以 -80°～80° 有符号角表示入射方向，显示角度绝对值。镜面左右固定，空气位于上方；鼠标输入转换并限制角度。零度明确不偏折；模式按钮暴露状态。

## 科学依据
[OpenStax 光的反射](https://openstax.org/books/university-physics-volume-3/pages/1-2-the-law-of-reflection) 规定角度相对法线测量且入射与反射在同侧；[OpenStax 斯涅尔定律](https://openstax.org/books/physics/pages/16-section-summary) 给出折射率与角度关系。实施者核对边界和浏览器画布路径；不代表完整光学教材核验。

## Risks / Trade-offs
水折射率 1.33 为近似常量；只模拟空气入射到水，不包含色散、反射强度或全反射。直线传播与测验的其他交互未全面验收。
