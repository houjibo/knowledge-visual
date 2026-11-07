## Why
数学四学段将损坏的新格式记录视为空对象并覆盖，写入失败后的重试也可能覆盖其他标签页新完成的记录，危及学习历史。

## What Changes
无法安全读取记录时保留原始数据及本页待写状态；写入时与最新有效记录合并，覆盖四学段和恢复场景。

## Capabilities
### New Capabilities

### Modified Capabilities
- `math-progress-identity`: 增加损坏数据保护和失败重试时的合并规则。

## Impact
数学四学段共享脚本、进度浏览器回归与差距记录；不迁移或删除学习数据。
