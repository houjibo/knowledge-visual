# middle-scientific-notation-approximation Specification

## Purpose
TBD - created by archiving change middle-scientific-notation-approximation. Update Purpose after archive.

## Requirements

### Requirement: 科学记数法同时满足等值与规范形式

页面 SHALL 给出有限的非零十进制数，支持学习者输入系数和整数指数构造 `a × 10^n`。反馈 MUST 分别判断是否与原数精确等值、系数是否满足 `1 ≤ |a| < 10`；非规范但等值的表达 SHALL 说明如何调整，不得当作规范答案。正负指数、负数和小数点移动的解释 MUST 与显示数值一致。

#### Scenario: 等值但未规范
- **WHEN** 学习者针对 `72 500 000` 输入 `72.5 × 10^6`，随后改为 `7.25 × 10^7`
- **THEN** 首次反馈说明数值相等但系数未规范，第二次反馈确认规范表示，并展示向右移动 7 位得到原数

### Requirement: 按问题指定精度给出近似数

页面 SHALL 提供至少两个不同精度的有限情境，要求学习者在揭晓前输入近似值。模型 MUST 以十进制位数正确处理恰好一半与进位；反馈 SHALL 展示相邻刻度、舍入方向、原数与使用 `≈` 的近似结果。若题目指定小数位，答案表示 MUST 保留该位数。

#### Scenario: 百分位进位
- **WHEN** 学习者把 `7.995 km` 按 `0.01 km` 取近似值，先输入 `7.99`，再输入 `8.00`
- **THEN** 首次反馈提示观察千分位，第二次反馈给出 `7.995 km ≈ 8.00 km`，数轴定位于 `7.99` 和 `8.00` 之间

### Requirement: 完成门槛与静态可用性

页面 SHALL 仅在独立完成正、负指数各一例和两种精度的近似数后记录本机学习进度；错误提交与主动查看示例不得计入。主要操作 MUST 可由键盘完成，反馈有可读文字，320px 不横向溢出，并在站点子路径和本地文件直开时加载相对资源。存储失败 MUST 显示可重试状态。

#### Scenario: 完成、重载与本地文件
- **WHEN** 学习者完成指定的四类题，重载页面并从初中数学目录返回主题
- **THEN** 页面和目录显示同一完成状态；本地文件打开时模型和交互仍可用
