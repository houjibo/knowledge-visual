## 1. 实现与验证

- [x] 1.1 增加固定版本测试依赖和独立本地服务器配置
- [x] 1.2 编写并运行四条真实浏览器试点，覆盖导航、操作和反馈
- [x] 1.3 更新使用说明、结果和限制，完成回归检查

## 验证记录

- 2026-11-07：Playwright 1.65.0 使用本机 Chrome 156.0.8078.81，独立本地 HTTP 服务，四条路径在桌面及模拟窄屏各运行一次，共 8 项通过；监听已访问页面的未捕获 JavaScript 异常。
- `python3 tests/inventory_test.py`、清单过期检查、`python3 scripts/check_site.py`、`node tests/progress.test.js`、`node tests/mode-switch.test.js` 及 OpenSpec 严格校验通过。
- 本轮未验证 file://、真实移动设备、完整学习挑战、跨浏览器、全站脚本异常或教学内容。
