## Why

多位数乘法的限时挑战会用无界随机循环补足三个干扰项。当随机源重复返回同一个值时，选项无法增加，浏览器主线程会被占满，学习者无法开始挑战；近期全站风险盘点已定位到这段生成逻辑。

## What Changes

- 为简单、中等和困难三档挑战定义有限的干扰项候选，并保证每题能展示四个互不相同的选项。
- 在固定随机值下回归验证题目仍能及时生成、唯一正确答案保持正确，且挑战可以继续作答。

## Capabilities

### New Capabilities

- `bounded-multiplication-challenge`: 多位数乘法限时挑战的选项生成与作答正确性。

### Modified Capabilities

无。

## Impact

- 影响 `math/topics/multi-digit-multiplication/index.html` 的挑战题选项生成。
- 新增浏览器回归用例，覆盖三档难度、重复随机值及选项唯一性；不引入新依赖或改变计分规则。
