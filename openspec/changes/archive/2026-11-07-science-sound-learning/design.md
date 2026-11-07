## Context
画布横轴和动画速度没有实际时间标定，频率数值是相对档位；不同材料的声速受材料性质及环境影响，不能简单地按固液气绝对排序。

## Goals / Non-Goals
保证波形标签、介质说明和测验计分一致；不模拟真实声压、声速、听觉或播放声音。

## Decisions
用相对频率档位和示意振幅解释波形；展示 20°C 空气、淡水及钢铁纵波示例，说明图示速度不按比例；记录每题首次答案并支持回看；动画暂停时允许操作并重绘。

## Evidence
[OpenStax 声速表](https://openstax.org/books/physics/pages/14-1-speed-of-sound-frequency-and-wavelength) 提供不同介质的声速例子及材料条件；[OpenStax 波与听觉](https://openstax.org/books/psychology/pages/5-2-waves-and-wavelengths) 说明频率、音调及振幅、响度之间的关系。

## Risks / Trade-offs
图示不具备实际时间、空间或声压标定，也不播放声音；测试覆盖主要控件、波形相对变化和测验流程，不代表完整听觉教学评审。
