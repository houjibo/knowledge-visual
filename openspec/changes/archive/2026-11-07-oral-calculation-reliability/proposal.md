## Why
口算填数题初始化依赖无界随机去重，重复随机值会阻塞页面；限时进度未反映对错，结束后旧题延时仍可能运行，闯关错误反馈未高亮正确选项。

## What Changes
有限生成干扰项，记录限时对错并处理倒计时与重开时序，修正闯关正确选项高亮，给答案输入添加名称。

## Capabilities
### New Capabilities
- `oral-calculation-reliability`: 可运行且反馈一致的口算练习。

### Modified Capabilities

## Impact
小学数学口算主题、浏览器回归与交互证据。
