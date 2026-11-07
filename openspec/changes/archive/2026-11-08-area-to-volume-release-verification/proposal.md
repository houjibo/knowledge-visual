## Why
面积到体积路线已在本地根路径验证，但独立站将部署在子路径；还需要确认发布包与直接打开静态文件时的相对导航。

## What Changes
在发布包和部署后浏览器检查中加入整条路线，在本地文件场景验证相邻主题及返回路线。

## Capabilities
### New Capabilities
- `area-to-volume-release-verification`: 路线在发布子路径和本地文件下的导航验证。

### Modified Capabilities

## Impact
发布后代表路径测试、静态文件兼容性测试与发布计划；不改变站点行为。
