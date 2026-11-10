## Why

“规律与序列”页面在初始化图形题、切换涂色模式或开始限时挑战时，可能因重复随机值进入无界重抽，阻塞主线程。固定随机值即可稳定复现，学习者因此无法打开页面或继续练习。

## What Changes

- 用有限候选生成图形、数字和挑战选项，保留四个互异选项及唯一正确答案。
- 从有限网格单元中无放回选择涂色题空格，确保固定随机值下也能完成生成。
- 增加固定随机边界、各模式答题反馈和 320px 窄屏的浏览器回归。

## Capabilities

### New Capabilities
- `bounded-pattern-sequences-generators`: 规律与序列页面各练习模式在重复随机值下有限生成并保留正确答案。

### Modified Capabilities

无。

## Impact

- 修改 `math/topics/pattern-sequences/index.html`。
- 新增浏览器回归，并登记交互证据、风险清单和差距台账。
- 不增加运行时依赖，不改变静态页面入口。
