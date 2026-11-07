## Why

此前四个主题的操作只由一次手动浏览器抽查覆盖，模拟 DOM 测试无法发现真实页面加载、事件和导航的回归。

## What Changes

- 增加可重复运行的真实浏览器试点，覆盖四个代表主题的导航和关键交互。
- 记录运行依赖、独立服务、浏览器选择及目前未覆盖的场景。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

无：为已有产品行为增加自动化验证，不改变产品行为。

## Impact

新增仅供开发测试的 Playwright 依赖和配置；静态页面无需 Node 或构建步骤即可运行。
