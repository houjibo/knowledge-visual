## Why

《生活用电》面向中学生，现有“遇触电先切断电源”和“保险丝熔断后查明原因再更换”没有明确限定由成年人或专业人员处理，容易被误读为让学习者自行操作。将应急处置做成始终可见的安全步骤图，并让测验强调呼救、自保和专业处理，可避免把知识练习变成危险操作指引。

## What Changes

- 用常显的因果/步骤图说明：先呼救并保护自己；只有成年人能从安全位置操作时才断电；断电未确认前不接触伤者或线路；遇高压或落地电线时远离并联系电力部门及急救。
- 明确保险丝熔断后不得让学习者自行拆换或反复送电，应告知成年人并由专业人员检查；保留不得用铜丝替代的知识点。
- 更新安全用电测验和桌面、窄屏浏览器回归，记录权威依据与剩余核验范围。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `household-circuit-safety`：补充适龄触电应急指引及保险丝熔断后的安全处置要求。

## Impact

- 影响 `physics/middle/household-circuits.html` 的常显应急说明及保险丝测验。
- 扩展 `tests/browser/household-circuit-safety.spec.js`，更新 OpenSpec、主题交互证据和 `docs/gaps.md`。
- 不改变电路示意模型、页面 URL、进度数据、共享依赖或部署架构。
