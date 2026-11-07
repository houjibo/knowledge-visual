## Why
现有全站冒烟直接加载仓库而不是发布包，无法发现发布产物中遗漏的页面、资源或子路径下的脚本错误。

## What Changes
在真实生成的发布包和项目子路径下逐页执行桌面浏览器加载检查，并保留四学科桌面和窄屏代表性交互。

## Capabilities
### New Capabilities

### Modified Capabilities
- `static-release-artifact`: 增加发布包所有清单页面的子路径加载验证。

## Impact
发布验证脚本、测试服务器与运营文档；不代表页面内容和全部交互已经核验。
