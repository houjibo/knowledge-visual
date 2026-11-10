## Why

复式统计表页启动时会生成读表题；查具体值和求合计的两个分支用无界随机重抽干扰项。固定随机值 0 已复现页面加载超时，接近 1 也会令合计选项无法补齐，学习者可能在进入任何模式前就遇到页面卡住。

## What Changes

- 查具体值和求合计题改为从有限偏移候选中生成选项。
- 保证四个选项均为正整数、彼此不同，并且恰有一个正确答案。
- 增加固定随机边界下的桌面/移动浏览器回归，并纳入交互证据索引。

## Capabilities

### New Capabilities

- `compound-statistical-table-reading-practice`: 规范复式统计表读表练习题目的有限选项生成和唯一正确答案。

### Modified Capabilities

无。

## Impact

影响 `math/topics/compound-statistical-tables/index.html`、浏览器回归测试、交互证据与风险索引及 `docs/gaps.md`。不新增依赖，不改变复式统计表的数据范围、题目种类或进度存储。
