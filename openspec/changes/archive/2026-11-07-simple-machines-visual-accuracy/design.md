## Context
画布坐标向下为正，原旋转符号与左右下沉文字相反；吊线和钩码随杆整体旋转。动滑轮底部绕绳方向不对且被轮面遮住。

## Goals / Non-Goals
使示意方向、吊线和读数一致，并明确滑轮力关系的理想假设；不模拟摩擦、动力学或滑轮组全部绕法。

## Decisions
杆绕支点按画布坐标方向旋转，钩码从旋转后的挂点竖直下垂；动滑轮绳索绘在轮面后续层并沿下半圆连续绕行。滑块关联标签，切换按钮暴露选中状态。

## 科学依据
[OpenStax Physics：简单机械](https://openstax.org/books/physics/pages/9-3-simple-machines) 说明杠杆力臂及理想机械忽略摩擦；[OpenStax College Physics：简单机械](https://openstax.org/books/college-physics/pages/9-5-simple-machines) 说明无摩擦滑轮组的力学优势。本次实施者核对转矩方向、示意几何与条件说明，不代表完整教材或物理模型审核。

## Risks / Trade-offs
仅以固定倾角表示下沉方向，不代表实际角加速度或静态受力平衡过程；读屏和真实设备体验仍需进一步核验。
