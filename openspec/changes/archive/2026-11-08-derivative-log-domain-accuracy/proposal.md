## Why

自然对数在非正数处无定义，但导数页面允许切点位于该区域并显示 NaN 及无效画布标注，容易误导学习者。

## What Changes

- 明确自然对数及其导数的定义域，在无效切点显示原因。
- 禁止绘制未定义的点与线，在有效边界恢复真实数值。

## Capabilities

### New Capabilities

- `derivative-log-domain-accuracy`: 自然对数的定义域和图文反馈一致。

### Modified Capabilities

无。

## Impact

影响高中导数页面的自然对数展示和专项浏览器回归；极值搜索仍需独立核验。
