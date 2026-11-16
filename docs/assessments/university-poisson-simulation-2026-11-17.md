# 大学随机过程：泊松过程模拟核查

核查日期：2026-11-17。大学随机过程属于本站大学数学拓展主题，不计入微积分和线性代数基础轨覆盖分母；此次不是完整课程审计。性质和指数间隔依据 MIT OCW [概率论摘要第 6.2 节](https://ocw.mit.edu/courses/res-6-012-introduction-to-probability-spring-2018/d973b10c2587781f86ca4f2aff49098f_MITRES_6_012S18_Textbook.pdf)；独立合并与拆分参考[泊松过程讲义](https://ocw.mit.edu/courses/6-262-discrete-stochastic-processes-spring-2011/resources/lecture-5-poisson-combining-and-splitting/)。

## 发现与修正

[随机过程页](../../math/uni/stochastic-process.html)之前在修改强度 λ 后保留旧强度的样本曲线和计数，却显示新强度的理论值；初始和重置状态也把尚未生成的样本显示为零事件。现调整强度即清空曲线与样本统计并提示重做，理论计数明确对应 30 秒，实际模拟的零事件结果显示 0 并绘制零水平线。观测平均间隔只使用窗口内相邻事件的完整间隔，不含起点至首次事件与末次事件后的截尾区间；不足两次事件时显示不可用，有限窗口选择可能影响这一统计。

指数间隔以 `−log(U)/λ` 生成；随机数为零对应超出观察窗口，避免循环卡死。为防异常随机源产生无穷密集事件，若窗口内事件超过 10000 则丢弃样本并报告未完成，而不将截断样本呈现为完整结果。此上限是实现限制，并非泊松过程理论上限。页面补明不相交区间独立、增量服从按区间长度参数化的泊松分布、独立随机拆分条件，以及实际应用须核验模型假设。

## 验证与边界

桌面和移动专项覆盖泊松、马尔可夫、布朗三个部分共 20 项；验证受控间隔、零随机数和零事件、超限处理、参数切换与重置、320px、键盘、直接文件及发布子路径。完整 `npm run check` 通过：功能套件 2588 项通过、8 项按条件跳过，401 页加载与发布构建专项 4 项通过；[远端工作流](https://github.com/houjibo/knowledge-visual/actions/runs/43969924146)成功；公网 revision 为 `5769be7e070f08b9f09ab0e6cb45ef209a9bcb8b`，桌面和移动端专项 6 项通过，2 项本地路径检查按条件跳过。这不代表整个题库、真实设备或屏幕阅读器已完成审核。变更契约见[OpenSpec](../../openspec/changes/archive/2026-11-17-university-poisson-simulation-consistency/proposal.md)。
