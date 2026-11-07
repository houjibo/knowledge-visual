## Context
静态线索盘点指出多个 div 控件；浏览源码确认模式、分子卡片和测验均只绑定点击。重复启动成键动画会叠加帧链，完成记录也不检查写入结果。

## Goals / Non-Goals
键盘可选择四种模式、键型、杂化和分子；六道不同题目答对后按原规则保存并处理失败；修正本次核对到的两个过度简化说明，不宣称完整化学内容验收。

## Decisions
原生按钮同步选中状态；答对后的题目锁定并跨题保留，答错可重试；存储失败提供重试。切换成键动画时取消旧帧。电负性差作为连续趋势及粗略线索，分子极性依据偶极矩的矢量和。

## 科学依据
[OpenStax 共价键](https://openstax.org/books/chemistry-2e/pages/7-2-covalent-bonding) 说明电负性差与离子性变化的连续性；[OpenStax 分子结构与极性](https://openstax.org/books/chemistry-2e/pages/7-6-molecular-structure-and-polarity) 说明键偶极矩在空间中的矢量和。实施者核对上述两处文字，其他模型和教材内容仍需检查。

## Risks / Trade-offs
分子图仍为二维示意而非完整三维轨道模拟；读屏和真实设备未全面核验。进度不保存未完成的单题记录。
