## Context
五页拥有相同的模式切换结构，但 div 入口不可通过 Tab 到达。

## Decisions
使用原生 button、aria-pressed 和 aria-controls，并保持原有 click 切换与绘制行为；增加可见焦点，测试键盘 Enter、空格及鼠标切换。此变更不声称内部操作和主题内容已全面验证。
