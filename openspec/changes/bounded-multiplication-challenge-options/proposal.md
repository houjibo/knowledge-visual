## Why

小学表内乘法挑战在固定随机值 0 或接近 1 时会因重复答案候选而无限补选，开始挑战后主线程卡住，学习者无法开始答题。需要保证挑战选项在随机源重复时也能有限生成。

## What Changes

- 将无界重抽替换为有限的正整数候选池，为每题生成四个互异选项并保留正确答案。
- 增加固定随机边界、正确反馈、下一题及窄屏布局的桌面/移动浏览器回归。

## Capabilities

### New Capabilities

- `multiplication-challenge-reliability`: 表内乘法挑战的有限选项生成、唯一正确答案和答题推进。

### Modified Capabilities

无。

## Impact

- 修改 `math/topics/multiplication/index.html`。
- 登记浏览器回归并更新交互证据、风险清单和差距台账。
- 不增加运行时依赖。
