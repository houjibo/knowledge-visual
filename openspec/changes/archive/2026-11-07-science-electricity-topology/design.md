## Context
原图将导线穿过元件而非连接其两端，并联支路也绕过灯泡。画面上看似发光的灯泡与所画的电气连接不一致。

## Goals / Non-Goals
示意图中的每条闭合路径都经过相应灯泡，支持暂停与键盘操作；亮度只在相同灯泡、理想恒压电源和理想导线下定性比较，不模拟实际电池内阻或灯丝温度。

## Decisions
将导线连接到电池、开关和灯泡的端点，灯泡支路之间仅在两端节点汇合；小点沿连接路径定性表示传统电流方向，不代表电子的真实速度。用可访问名称描述画布状态，暂停后操作仍更新图示。

## Evidence
[OpenStax 串并联电路](https://openstax.org/books/physics/pages/19-section-summary) 区分串联的相同电流和并联的相同电压；[OpenStax 简单电路](https://openstax.org/books/college-physics/pages/20-2-ohms-law-resistance-and-simple-circuits) 说明电源、负载与导线组成闭合回路。连接图由浏览器测试按元件端点验证连通性。

## Risks / Trade-offs
模型没有模拟支路故障、真实电池和额定参数；动画是概念示意而非电流测量。页面其他电气安全内容仍需单独核查。
