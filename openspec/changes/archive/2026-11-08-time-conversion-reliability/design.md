## Context
一天开始的午夜是 00:00，中午是 12:00；普通 12 小时钟面时针一天转两圈，并不能仅凭指针区分上下午。原转换规则与固定说明在这两个边界及不同时间存在矛盾。

## Decisions
数字范围采用 00:00–23:59，午夜与中午明确以中文标记；其他时段使用凌晨、上午、中午、下午、晚上的一致分组。两个指针图均标明普通钟面，另一侧数字使用 24 时制。选项和配对从 96 个整点或刻钟时刻有限抽样，随机值恒定也可终止。原生按钮支持键盘并在作答后禁用；错误配对反馈结束前锁定选择，避免旧定时器覆盖新选择。时间线事件卡片无键盘入口等问题不在本次范围。

## Evidence
[NIST 时间说明](https://www.nist.gov/pml/time-and-frequency-division/times-day-faqs) 区分一天开始的 00:00 和一天结束的 24:00，说明恰好午夜及中午使用 AM/PM 可能产生歧义；[NIST 时间编码](https://www.nist.gov/pml/time-and-frequency-division/time-distribution/radio-station-wwv/wwv-and-wwvh-digital-time-code) 说明 00、12 和 23 时的计时范围。
