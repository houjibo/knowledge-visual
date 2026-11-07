## Why
搭方块画布缩放后坐标转换错误，触摸可能落到错误位置；画布没有键盘等效操作，且修改方块后可能保留过期结果。

## What Changes
使用响应式按钮网格替换画布，支持键盘移动及放置、移除，显示目标和方块状态，并同步更新反馈。

## Capabilities
### New Capabilities
- `volume-units-accessible-building`: 搭方块的触摸和键盘操作。

### Modified Capabilities

## Impact
小学数学体积与容积单位主题搭建活动、浏览器回归与交互证据。
