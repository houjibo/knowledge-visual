## Why

高中化学“化学实验”页的四个模式入口使用不可聚焦的 `div`，键盘用户按 Tab 会跳过模式选择，无法仅用键盘切换四类实验内容。按已复现的交互缺口补齐页签语义和键盘操作，能让实验制备、性质验证、定量实验和实验设计均可访问。

## What Changes

- 将四个实验模式入口实现为有明确选中状态的可访问页签。
- 支持方向键循环切换、Home/End 跳转，并同步更新当前面板；保留 Enter、Space、鼠标和触屏操作。
- 为当前实验内容提供与选中页签关联的面板语义及可见焦点提示。
- 为桌面、移动视口和四种实验模式增加浏览器回归。

## Capabilities

### New Capabilities
- `high-chemistry-experiment-mode-accessibility`: 约束高中化学实验页面的模式页签语义、键盘交互和内容关联。

### Modified Capabilities

## Impact

- 影响 `chemistry/high/12-experiment.html` 的模式入口和动态内容面板。
- 新增浏览器测试并登记到交互覆盖清单；无依赖、数据格式或进度规则变更。
