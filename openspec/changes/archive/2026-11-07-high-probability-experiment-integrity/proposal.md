## Why
高中概率实验中，批量操作在重置之后仍会写入，改变袋子球数后旧批次也继续执行；骰子目标切换时命中数被清零而总次数保留。一道单选题还含两个等价正确答案。

## What Changes
重置时取消对应批量任务；修改球数时取消批量并清空样本；骰子目标切换基于完整历史分布重新计算，并修正单选选项、键盘模式及滑块标签。

## Capabilities
### New Capabilities
- `high-probability-experiments`: 硬币、骰子和摸球实验的批量与统计一致性。

### Modified Capabilities

## Impact
高中数学概率页面、浏览器测试及交互证据。
