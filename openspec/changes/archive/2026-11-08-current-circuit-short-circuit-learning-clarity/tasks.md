## 1. 教学说明与示意

- [x] 1.1 修订短路说明并添加带有序因果步骤的可展开说明；核对页面同时呈现模型边界、风险和禁止实际短接的提示
- [x] 1.2 扩展 `current-circuit-topology` 浏览器测试；桌面和移动项目验证 Enter/空格切换、步骤文本顺序、未计算故障电流及 320 像素视口无横向溢出

## 2. 证据与差距记录

- [x] 2.1 更新交互证据索引和电气安全差距；运行生成脚本并通过差异检查
- [x] 2.2 补全 `current-circuit-topology` 的 Purpose 并增加短路模型边界要求；全量 OpenSpec 严格校验通过

## 3. 集成验证与归档

- [x] 3.1 运行 `npx playwright test tests/browser/current-circuit-topology.spec.js`（桌面、移动共 6 项）、`npm run check:static`（199 项）和 `git diff --check` 均通过；其他页面与真实设备仍需后续核查
- [x] 3.2 归档后确认规范已合并；归档后的 `openspec validate --all --strict` 通过
