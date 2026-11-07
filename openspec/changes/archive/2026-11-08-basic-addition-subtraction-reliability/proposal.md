## Why
基础加减法的凑十和数轴随机补位可能无限循环；重复提交同一题会累加成绩并提前触发完成记录。

## What Changes
- 用有限候选生成凑十和数轴选项，并防止同题重复计分。
- 锁定自由练习和加法挑战的已提交题目，换题时清理旧回调。
- 完成记录写入成功时才提示保存成功。
- 共享纯文本提示不再拦截窄屏上的点击。

## Capabilities
### New Capabilities
- `basic-addition-subtraction-reliability`: 两个基础数学主题的出题和计分可靠性。

### Modified Capabilities

## Impact
小学数学加减法和减法页面、共享提示样式、浏览器回归与交互风险台账；其他模式仍需核查。
