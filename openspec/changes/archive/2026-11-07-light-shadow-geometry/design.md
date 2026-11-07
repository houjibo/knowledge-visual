## Context
原中心光线直接延伸到障碍物后，阴影终点固定，与点光源直线传播和相似三角形不一致。

## Goals / Non-Goals
显示不透明物体遮挡光线以及位置改变时的影子变化；支持滑块、键盘与原有鼠标操作。不模拟扩展光源、半影、衍射或光强。

## Decisions
把画面光源简化为点；以光源和障碍物上下边缘连线计算后方影子轮廓；动画中光线只延伸至障碍物，完成后显示阴影。滑块只显示距离的定性描述，避免把像素当作实际单位。

## 科学依据
[OpenStax 光线模型](https://openstax.org/books/college-physics/pages/25-1-the-ray-aspect-of-light) 将光线作为几何直线，[OpenStax 相似三角形](https://openstax.org/books/contemporary-mathematics/pages/10-3-triangles) 说明对应长度成比例。实施者依据点光源的两条边界光线核对画布几何，未验收扩展光源及真实设备。

## Risks / Trade-offs
点光源示意只有清晰本影，不代表真实面积光源的半影；原测验与其他主题功能不在本次范围。
