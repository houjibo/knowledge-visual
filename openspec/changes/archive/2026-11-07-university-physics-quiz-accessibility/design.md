## Context
选项是 div，键盘不可达；五页忽略 PageProgress.markDone 的保存结果。

## Decisions
采用原生按钮和 aria-pressed，答题后保留焦点，提交后锁定答案；显示保存结果并允许重试，仍保留原题目、即时反馈和 3/4 通过规则。此项不代表题目内容已全面核验。
