## Why
20 以内进位加减法使用无界随机重试生成题目和选项；闯关在反馈等待期可多次提交同一题，导致关数与成绩失真。

## What Changes
有限生成进位、退位题与选项；凑十、破十在正确后锁定本题；闯关每题只接受一次提交，完成后可重新开始，并拒绝非整数输入。

## Capabilities
### New Capabilities
- `carry-borrow-practice`: 有限生成与可靠计分的进位、退位练习。

### Modified Capabilities

## Impact
小学数学进位加减法页面、浏览器回归、交互证据。
