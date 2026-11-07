## Why

圆锥曲线页面每次调整参数都会替换滑块，导致焦点丢失，连续键盘输入和拖拽被打断，控件也没有关联名称。

## What Changes

- 同一曲线中更新数值时保留滑块，只在切换曲线时重新生成。
- 为滑块关联可见标签，并验证连续键盘和拖拽操作。

## Capabilities

### New Capabilities

- `conic-continuous-parameter-control`: 圆锥曲线参数支持连续调节。

### Modified Capabilities

无。

## Impact

影响高中数学圆锥曲线的参数控件及浏览器回归，不改变曲线公式。
